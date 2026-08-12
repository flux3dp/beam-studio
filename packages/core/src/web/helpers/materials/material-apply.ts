import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { getPresetDisplayName, resolvePresetSettings } from '@core/helpers/api/material-catalog/utils';
import {
  applyPreset,
  clampLayerConfigLimits,
  getData,
  setPostPresetChangeOverride,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import { checkPresetTutorialStep } from '@core/helpers/presets/preset-tutorial';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { Preset } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialPreset, PresetValues } from '@core/interfaces/IMaterial';

import { isMaterialBrowserActive } from './isMaterialBrowserActive';

/** Base values merged with the user's [Customized] overlay for the given context */
export const resolveWithOverlay = (
  preset: MaterialPreset,
  model: ReturnType<typeof getPresetModel>,
  module: LayerModuleType,
): null | PresetValues => {
  const base = resolvePresetSettings(preset.settings, model, module);

  if (!base) return null;

  if (preset.origin !== 'default') return base;

  const overlay = useMaterialStore.getState().presetOverrides[preset.id];

  if (!overlay) return base;

  const { name: _name, ...overlayValues } =
    (resolvePresetSettings(overlay as MaterialPreset['settings'], model, module) as
      | null
      | (PresetValues & { name?: string })) ?? {};

  return { ...base, ...overlayValues };
};

/**
 * Adapter into the legacy apply pipeline. configName is written by applyPreset as
 * `isDefault ? key : name`, so migrated defaults keep their presets.ts key (old-mode
 * round-trip) and user presets keep their display name.
 */
export const toLegacyPreset = (preset: MaterialPreset, values: PresetValues, module: LayerModuleType): Preset => ({
  ...values,
  isDefault: preset.origin === 'default',
  key: preset.legacyKey ?? preset.id,
  module,
  name: getPresetDisplayName(preset),
});

/**
 * Apply a material preset to layers: legacy parameter write (dpi-override resolution,
 * forced keys, speed clamping) + the authoritative data-materialId/presetId refs.
 */
export const applyMaterialPreset = (
  material: Material,
  preset: MaterialPreset,
  { batchCmd, layers }: { batchCmd?: IBatchCommand; layers: Element[] },
): void => {
  const presetModel = getPresetModel(useDocumentStore.getState().workarea);

  for (const layer of layers) {
    const module = (getData(layer, 'module') as LayerModuleType) ?? LayerModule.LASER_UNIVERSAL;
    const values = resolveWithOverlay(preset, presetModel, module);

    if (!values) continue;

    // dpi is a first-class preset parameter (D19) but not part of the legacy config-key
    // loops; write it first so applyPreset resolves dpiOverrides against the new value.
    if (values.dpi) {
      writeDataLayer(layer, 'dpi', values.dpi, { batchCmd });
    }

    applyPreset(layer, toLegacyPreset(preset, values, module), { batchCmd });
    writeDataLayer(layer, 'materialId', material.id, { batchCmd });
    writeDataLayer(layer, 'presetId', preset.id, { batchCmd });
  }

  useMaterialStore.getState().pushRecent(material.id, preset.id);
  checkPresetTutorialStep({ isDefault: preset.origin === 'default', key: preset.legacyKey });
};

/**
 * Resolve an applied material/preset from stored refs. Order: presetId (authoritative)
 * → configName matched against catalog legacyKeys and user preset names (files
 * authored in old mode or before this feature). Null = Manual.
 */
export const resolveMaterialRef = ({
  configName,
  presetId,
}: {
  configName?: string;
  presetId?: string;
}): null | { material: Material; preset: MaterialPreset } => {
  const { presetAdditions, userMaterials } = useMaterialStore.getState();
  const findUser = (predicate: (preset: MaterialPreset) => boolean) => {
    for (const material of userMaterials) {
      const preset = material.presets.find(predicate);

      if (preset) return { material, preset };
    }

    // User presets attached to catalog materials
    for (const [materialId, presets] of Object.entries(presetAdditions)) {
      const preset = presets.find(predicate);

      if (preset) {
        const material = materialCatalogCache.getCatalogSync().materials.find(({ id }) => id === materialId);

        if (material) return { material, preset };
      }
    }

    return null;
  };

  if (presetId) {
    const hit = findUser(({ id }) => id === presetId) ?? materialCatalogCache.findPresetById(presetId);

    if (hit) return hit;
  }

  if (!configName || configName.trim() === '') return null;

  // Catalog presets by legacy key
  for (const material of materialCatalogCache.getCatalogSync().materials) {
    const preset = material.presets.find(({ legacyKey }) => legacyKey === configName);

    if (preset) return { material, preset };
  }

  // User presets by display name (legacy user presets stored name in configName)
  return findUser((preset) => getPresetDisplayName(preset) === configName);
};

/** Layer-element flavor of resolveMaterialRef */
export const resolveLayerMaterialRef = (layer: Element): null | { material: Material; preset: MaterialPreset } =>
  resolveMaterialRef({ configName: getData(layer, 'configName'), presetId: getData(layer, 'presetId') });

/**
 * Merged (base + overlay) preset values for a layer's applied material preset in the
 * active machine context, or null when the browser is inactive / the layer is Manual.
 * Used by DpiBlock to resolve dpiOverrides in new mode.
 */
export const getLayerMaterialPresetValues = (layer: Element): null | PresetValues => {
  if (!isMaterialBrowserActive()) return null;

  const ref = resolveLayerMaterialRef(layer);

  if (!ref) return null;

  const module = (getData(layer, 'module') as LayerModuleType) ?? LayerModule.LASER_UNIVERSAL;

  return resolveWithOverlay(ref.preset, getPresetModel(useDocumentStore.getState().workarea), module);
};

/**
 * New-mode replacement for postPresetChange: re-resolves every layer's material ref
 * after workarea/watt/module changes, re-applies merged values, and degrades
 * unresolvable refs to Manual while keeping the layer's raw parameters.
 */
export const postMaterialPresetChange = (): void => {
  const presetModel = getPresetModel(useDocumentStore.getState().workarea);

  layerManager.getAllLayers().forEach((layer) => {
    const layerElement = layer.getGroup();

    if (!layerElement) return;

    const ref = resolveLayerMaterialRef(layerElement);

    if (ref) {
      const module = (getData(layerElement, 'module') as LayerModuleType) ?? LayerModule.LASER_UNIVERSAL;
      const values = resolveWithOverlay(ref.preset, presetModel, module);

      if (values) {
        // Unlike an explicit Apply, a context change respects the layer's current DPI:
        // applyPreset resolves dpiOverrides against it, so no dpi write here.
        applyPreset(layerElement, toLegacyPreset(ref.preset, values, module), { applyName: false });
        // Refs may have resolved through the configName fallback — persist them
        writeDataLayer(layerElement, 'materialId', ref.material.id);
        writeDataLayer(layerElement, 'presetId', ref.preset.id);
      } else {
        // No settings for this machine/module: degrade to Manual, keep raw params
        writeDataLayer(layerElement, 'materialId', undefined);
        writeDataLayer(layerElement, 'presetId', undefined);
        writeDataLayer(layerElement, 'configName', undefined);
      }
    } else if (getData(layerElement, 'presetId') || getData(layerElement, 'configName')) {
      writeDataLayer(layerElement, 'materialId', undefined);
      writeDataLayer(layerElement, 'presetId', undefined);
      writeDataLayer(layerElement, 'configName', undefined);
    }

    clampLayerConfigLimits(layerElement);
  });
};

let overrideRegistered = false;
let unsubscribePreference: (() => void) | null = null;

const syncOverride = (): void => {
  const shouldRegister = isMaterialBrowserActive();

  if (shouldRegister && !overrideRegistered) {
    setPostPresetChangeOverride(postMaterialPresetChange);
    overrideRegistered = true;
  } else if (!shouldRegister && overrideRegistered) {
    setPostPresetChangeOverride(null);
    overrideRegistered = false;
  }
};

/**
 * Install the postPresetChange override and keep it in sync with the
 * use-material-browser preference. Idempotent; called from Material Browser
 * entry points (chip mount, browser open).
 */
export const initMaterialApply = (): void => {
  syncOverride();

  unsubscribePreference ??= useGlobalPreferenceStore.subscribe(
    (state) => state['use-material-browser'],
    () => syncOverride(),
  );
};

/** Test-only */
export const resetMaterialApplyInit = (): void => {
  if (overrideRegistered) setPostPresetChangeOverride(null);

  overrideRegistered = false;
  unsubscribePreference?.();
  unsubscribePreference = null;
};
