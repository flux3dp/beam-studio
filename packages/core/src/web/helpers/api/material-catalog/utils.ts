import { type LayerModuleType, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getStorage } from '@core/app/stores/storageStore';
import i18n from '@core/helpers/i18n';
import { getLocaleLookupKeys } from '@core/helpers/locale-codes';
import localeHelper from '@core/helpers/locale-helper';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type {
  LocalizedString,
  Material,
  MaterialPreset,
  MaterialRegion,
  PresetValues,
} from '@core/interfaces/IMaterial';

/**
 * Resolve the parameter values of a preset for a machine/module context.
 * Chain: [model][module] → [model]['*'] → ['*'][module] → ['*']['*'].
 * Returns null when the preset has nothing applicable (hidden for this context).
 */
export const resolvePresetSettings = (
  settings: MaterialPreset['settings'],
  model: PresetModel,
  module: LayerModuleType,
): null | PresetValues => {
  // Legacy guard (mirrors getPresetsList): a preset scoped only to printing modules
  // never resolves for a non-printing module, even through wildcards.
  if (!printingModules.has(module)) {
    const concreteModules = Object.values(settings).flatMap((modules) =>
      modules ? Object.keys(modules).filter((key) => key !== '*') : [],
    );

    if (
      concreteModules.length > 0 &&
      concreteModules.every((key) => printingModules.has(Number(key) as LayerModuleType))
    ) {
      return null;
    }
  }

  const moduleKey = `${module}` as const;
  const modelScope = settings[model];
  const wildcardScope = settings['*'];

  return modelScope?.[moduleKey] ?? modelScope?.['*'] ?? wildcardScope?.[moduleKey] ?? wildcardScope?.['*'] ?? null;
};

/** Active catalog region: Preferences override first, then language + timezone detection */
export const getMaterialRegion = (): MaterialRegion => {
  const override = useGlobalPreferenceStore.getState()['material-region-override'];

  if (override && override !== 'auto') return override;

  if (localeHelper.isNorthAmerica) return 'us';

  if (localeHelper.isEu) return 'eu';

  if (localeHelper.isTw) return 'tw';

  if (localeHelper.isJp) return 'jp';

  return 'global';
};

/** A material is visible in a region when untagged, tagged global, or tagged with that region */
export const isMaterialVisibleInRegion = (material: Material, region: MaterialRegion): boolean => {
  const { regions } = material;

  if (!regions || regions.length === 0 || regions.includes('global')) return true;

  return regions.includes(region);
};

export const resolveLocalizedString = (value: LocalizedString | undefined): string | undefined => {
  if (value === undefined) return undefined;

  if (typeof value === 'string') return value;

  // Accept either the app's language code or its canonical BCP-47 tag, so catalog content
  // is not tied to the historical codes (see helpers/locale-codes.ts).
  for (const key of getLocaleLookupKeys()) {
    if (value[key] !== undefined) return value[key];
  }

  return value.default;
};

export const getMaterialDisplayName = (material: Material): string => {
  if (material.nameKey) {
    const translated = i18n.lang.beambox.material_browser.catalog.materials[material.nameKey];

    if (translated) return translated;
  }

  return resolveLocalizedString(material.name) ?? material.id;
};

export const getPresetDisplayName = (preset: MaterialPreset): string => {
  if (preset.nameKey) {
    const translated = i18n.lang.beambox.material_browser.catalog.presets[preset.nameKey];

    if (translated) return translated;
  }

  const direct = resolveLocalizedString(preset.name);

  if (direct) return direct;

  // Bundled presets before the material_browser translations exist: reuse the legacy
  // dropdown names, which are complete in all 23 languages.
  if (preset.legacyKey) {
    const unit: 'inches' | 'mm' = getStorage('default-units') === 'inches' ? 'inches' : 'mm';
    const dropdown = i18n.lang.beambox.right_panel.laser_panel.dropdown[unit] as Record<string, string>;
    const legacyName = dropdown[preset.legacyKey];

    if (legacyName) return legacyName;
  }

  return preset.id;
};
