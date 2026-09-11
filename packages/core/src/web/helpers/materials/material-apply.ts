import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { mergedLegacyKeys } from '@core/app/constants/material-catalog/mapping';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { initMaterialStore, useMaterialStore } from '@core/app/stores/materialStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { getPresetDisplayName, resolvePresetValues } from '@core/helpers/api/material-catalog/utils';
import {
  applyPreset,
  clampLayerConfigLimits,
  forcedKeys,
  getConfigKeys,
  getData,
  getDefaultConfig,
  setPostPresetChangeOverride,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import { checkPresetTutorialStep } from '@core/helpers/presets/preset-tutorial';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { Preset } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialPreset, PresetValues } from '@core/interfaces/IMaterial';

import { isMaterialBrowserActive } from './isMaterialBrowserActive';

/** Store-bound resolvePresetValues: base values merged with the user's [Customized] overlay */
export const resolveWithOverlay = (
  preset: MaterialPreset,
  model: ReturnType<typeof getPresetModel>,
  module: LayerModuleType,
): null | PresetValues => resolvePresetValues(preset, useMaterialStore.getState().presetOverrides, model, module);

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

    // dpi is a first-class preset parameter (each DPI option is its own flat preset) but
    // not part of the legacy config-key loops — write it separately
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
 * Mobile-modal flavor of applyMaterialPreset: stage the resolved values in the config
 * store only (the modal's Save writes the layers later). Same forced keys and speed
 * clamp as applyPreset / the legacy dropdown, so both entry points stage one payload.
 */
export const stageMaterialPreset = (
  material: Material,
  preset: MaterialPreset,
  values: PresetValues,
  module: LayerModuleType,
): void => {
  const legacy = toLegacyPreset(preset, values, module);
  const { maxSpeed, minSpeed } = getWorkarea(useDocumentStore.getState().workarea);
  const defaultConfig = getDefaultConfig();
  const payload: Record<string, unknown> = {
    configName: legacy.isDefault ? legacy.key : legacy.name,
    materialId: material.id,
    presetId: preset.id,
    ...(values.dpi && { dpi: values.dpi }),
  };

  for (const key of getConfigKeys(module)) {
    let value = legacy[key];

    if (value === undefined) {
      if (!forcedKeys.includes(key as (typeof forcedKeys)[number])) continue;

      value = defaultConfig[key];
    }

    if (key === 'speed') value = Math.max(minSpeed, Math.min(value as number, maxSpeed));

    payload[key] = value;
  }

  useConfigPanelStore.getState().change(payload as never);
  useMaterialStore.getState().pushRecent(material.id, preset.id);
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
  const { userMaterials, userPresets } = useMaterialStore.getState();
  const findUser = (predicate: (preset: MaterialPreset) => boolean) => {
    const preset = userPresets.find(predicate);

    if (!preset) return null;

    // The owner is a user material or a catalog material (user preset attached to it)
    const material =
      userMaterials.find(({ id }) => id === preset.materialId) ??
      materialCatalogCache.getCatalogSync().materials.find(({ id }) => id === preset.materialId);

    return material ? { material, preset } : null;
  };

  if (presetId) {
    const hit = findUser(({ id }) => id === presetId) ?? materialCatalogCache.findPresetById(presetId);

    if (hit) return hit;
  }

  if (!configName || configName.trim() === '') return null;

  // Legacy keys the browser folds into another catalog preset (still listed by the legacy dropdown)
  const legacyName = mergedLegacyKeys[configName] ?? configName;

  // Catalog presets by legacy key
  for (const material of materialCatalogCache.getCatalogSync().materials) {
    const preset = material.presets.find(({ legacyKey }) => legacyKey === legacyName);

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
 * When the layer DPI changes and its applied preset belongs to a per-DPI group (groupId
 * links the flat siblings, e.g. wood_engraving ↔ wood_engraving_high), switch to the group
 * member declaring the new dpi: rewrite the refs and surgically apply only the parameter
 * keys where the sibling differs from the current preset — manual tweaks on keys the
 * family agrees on survive, mirroring the legacy dpiOverrides surgery. No-op without a
 * group or when no member declares the new dpi (the params then simply stay).
 */
export const switchPresetDpiGroup = (
  layer: Element,
  newDpi: EngraveDpiOption,
  opts: { batchCmd?: IBatchCommand } = {},
): boolean => {
  if (!isMaterialBrowserActive()) return false;

  const ref = resolveLayerMaterialRef(layer);

  if (!ref?.preset.groupId) return false;

  const module = (getData(layer, 'module') as LayerModuleType) ?? LayerModule.LASER_UNIVERSAL;
  const model = getPresetModel(useDocumentStore.getState().workarea);
  const current = resolveWithOverlay(ref.preset, model, module);

  if (!current || current.dpi === newDpi) return false;

  const target = ref.material.presets.find(
    (preset) =>
      preset.groupId === ref.preset.groupId &&
      preset.id !== ref.preset.id &&
      resolveWithOverlay(preset, model, module)?.dpi === newDpi,
  );

  if (!target) return false;

  const values = resolveWithOverlay(target, model, module)!;

  for (const [key, value] of Object.entries(values)) {
    if (key === 'dpi' || current[key as keyof PresetValues] === value) continue;

    writeDataLayer(layer, key as Parameters<typeof writeDataLayer>[1], value as never, opts);
  }

  writeDataLayer(layer, 'presetId', target.id, opts);
  // configName compat shadow, mirroring applyPreset's isDefault ? key : name
  writeDataLayer(layer, 'configName', target.legacyKey ?? getPresetDisplayName(target), opts);

  return true;
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
      let preset = ref.preset;
      let values = resolveWithOverlay(preset, presetModel, module);

      if (!values && preset.groupId) {
        // The preset has no settings for this machine, but a per-DPI sibling might
        // (e.g. wood_engraving_high scopes only to HEXA RF; fbb2 falls back to the
        // base). Prefer the member declaring the layer's current DPI, else the first.
        const layerDpi = getData(layerElement, 'dpi');
        const candidates = ref.material.presets
          .filter((candidate) => candidate.groupId === preset.groupId && candidate.id !== preset.id)
          .map((candidate) => ({ candidate, resolved: resolveWithOverlay(candidate, presetModel, module) }))
          .filter(({ resolved }) => resolved);
        const pick = candidates.find(({ resolved }) => resolved!.dpi === layerDpi) ?? candidates[0];

        if (pick) {
          preset = pick.candidate;
          values = pick.resolved;
          writeDataLayer(layerElement, 'configName', preset.legacyKey ?? getPresetDisplayName(preset));
        }
      }

      if (values) {
        // Unlike an explicit Apply, a context change respects the layer's current DPI:
        // applyPreset resolves dpiOverrides against it, so no dpi write here.
        applyPreset(layerElement, toLegacyPreset(preset, values, module), { applyName: false });
        // Refs may have resolved through the configName fallback — persist them
        writeDataLayer(layerElement, 'materialId', ref.material.id);
        writeDataLayer(layerElement, 'presetId', preset.id);
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

/**
 * New-mode setup for every entry point (chip mount, browser/editor open, JSON import):
 * the self-syncing postPresetChange override, plus the legacy-preset migration once the
 * gate is on. Idempotent.
 */
export const initMaterialBrowser = (): void => {
  initMaterialApply();

  if (isMaterialBrowserActive()) initMaterialStore();
};

/** Test-only */
export const resetMaterialApplyInit = (): void => {
  if (overrideRegistered) setPostPresetChangeOverride(null);

  overrideRegistered = false;
  unsubscribePreference?.();
  unsubscribePreference = null;
};
