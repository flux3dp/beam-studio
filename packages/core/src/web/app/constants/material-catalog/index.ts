import type { PresetTable } from '@core/app/constants/presets';
import { presets as legacyPresets } from '@core/app/constants/presets';
import { dpiValueMap, type EngraveDpiOption } from '@core/app/constants/resolutions';
import { useStorageStore } from '@core/app/stores/storageStore';
import type { Preset } from '@core/interfaces/ILayerConfig';
import type {
  Material,
  MaterialCatalog,
  MaterialPreset,
  MaterialVariant,
  PresetValues,
} from '@core/interfaces/IMaterial';

import { materialDefs, presetMappings } from './mapping';
import { materialBrowserPresets } from './presets';

/** Every bundled preset: the legacy dropdown set plus the browser-only keys */
export const bundledPresets: PresetTable = { ...legacyPresets, ...materialBrowserPresets };

export { CATEGORY_COLORS, MATERIAL_CATEGORIES, MY_MATERIALS_ID, RECENTS_LIMIT } from './constants';
export { materialDefs, presetMappings } from './mapping';

/**
 * Strip legacy Preset metadata so only parameter values remain in a settings scope.
 *
 * The catalog is FLAT: dpiOverrides never leave the builder. A scope that carries them in
 * presets.ts becomes one value set per DPI option — the base declares its curated dpi
 * (250) with the overrides stripped, and each option above it becomes a separate preset
 * (see buildPresetsForMaterial). Scopes without overrides declare no dpi — applying them
 * leaves the layer's DPI untouched, exactly like the legacy dropdown.
 */
const toPresetValues = (preset: Preset, dpi?: EngraveDpiOption): PresetValues => {
  const {
    dpiOverrides,
    hide: _hide,
    isDefault: _isDefault,
    key: _key,
    module: _module,
    name: _name,
    ...values
  } = preset;

  return dpiOverrides && dpi ? { dpi, ...values, ...dpiOverrides[dpi] } : values;
};

/** Override options above the curated 250 DPI base, ascending (e.g. high → detailed → ultra) */
const getQualityOptions = (source: NonNullable<PresetTable[string]>): EngraveDpiOption[] => {
  const options = new Set<EngraveDpiOption>();

  for (const modules of Object.values(source)) {
    for (const preset of Object.values(modules!)) {
      for (const option of Object.keys(preset.dpiOverrides ?? {}) as EngraveDpiOption[]) {
        if (dpiValueMap[option] > dpiValueMap.medium) options.add(option);
      }
    }
  }

  return [...options].sort((a, b) => dpiValueMap[a] - dpiValueMap[b]);
};

const buildPresetsForMaterial = (materialId: string): MaterialPreset[] => {
  const result: MaterialPreset[] = [];

  for (const [key, mapping] of Object.entries(presetMappings)) {
    if (mapping.materialId !== materialId) continue;

    const source = bundledPresets[key];

    if (!source) continue;

    const settings: MaterialPreset['settings'] = {};

    for (const [model, modules] of Object.entries(source)) {
      for (const [moduleKey, preset] of Object.entries(modules!)) {
        (settings[model as keyof typeof settings] ??= {})[moduleKey as '*'] = toPresetValues(preset, 'medium');
      }
    }

    const qualityOptions = getQualityOptions(source);
    // Per-DPI families share a groupId so a layer DPI change can switch between them
    const group = qualityOptions.length > 0 ? { groupId: key } : {};

    result.push({
      ...group,
      id: key,
      legacyKey: key,
      nameKey: mapping.nameKey,
      origin: 'default',
      settings,
      ...(mapping.variantId && { variantId: mapping.variantId }),
    });

    // Every override option above the base becomes its own FLAT preset (values merged at
    // that dpi, no dpiOverrides), scoped to the models that actually curate that option.
    // The browser suffixes their shared name with the declared DPI.
    for (const option of qualityOptions) {
      const qualitySettings: MaterialPreset['settings'] = {};

      for (const [model, modules] of Object.entries(source)) {
        for (const [moduleKey, preset] of Object.entries(modules!)) {
          if (!preset.dpiOverrides?.[option]) continue;

          (qualitySettings[model as keyof typeof qualitySettings] ??= {})[moduleKey as '*'] = toPresetValues(
            preset,
            option,
          );
        }
      }

      result.push({
        ...group,
        id: `${key}_${option}`,
        nameKey: mapping.nameKey,
        origin: 'default',
        settings: qualitySettings,
        ...(mapping.variantId && { variantId: mapping.variantId }),
      });
    }
  }

  return result;
};

const bundledCatalogs: Partial<Record<'inch' | 'mm', MaterialCatalog>> = {};

/**
 * The bundled offline catalog, derived from presets.ts + the mapping table at first access.
 * Same schema as the FLUX Cloud response (docs/material-catalog-api.md); version 0 is
 * always superseded by any cloud version >= 1.
 *
 * A material carries exactly ONE authoritative thickness unit. For bundled content the
 * user's default-units picks which curated value the defs generate (mirroring the legacy
 * dropdown's mm/inches naming); material ids stay unit-independent, so layer refs and
 * favorites survive a unit switch.
 */
export const getBundledCatalog = (): MaterialCatalog => {
  const { isInch } = useStorageStore.getState();
  // `unit` doubles as the memo key and the emitted thicknessUnit value
  const unit = isInch ? 'inch' : 'mm';
  const cached = bundledCatalogs[unit];

  if (cached) return cached;

  const toThickness = ({
    thicknessInch,
    thicknessMm,
  }: {
    thicknessInch?: [number, number];
    thicknessMm?: number;
  }): Pick<MaterialVariant, 'thicknessDen' | 'thicknessNum' | 'thicknessUnit'> | undefined =>
    isInch
      ? thicknessInch && { thicknessDen: thicknessInch[1], thicknessNum: thicknessInch[0], thicknessUnit: unit }
      : thicknessMm !== undefined
        ? { thicknessNum: thicknessMm, thicknessUnit: unit }
        : undefined;

  const materials: Material[] = materialDefs.map(
    ({ category, id, image, nameKey, regions, shopLinks, tags, variants }) => ({
      category,
      id,
      nameKey,
      presets: buildPresetsForMaterial(id),
      ...(image && { image: `core-img/material-catalog/${image}.jpg` }),
      ...(regions && { regions }),
      ...(shopLinks && { shopLinks }),
      ...(tags && { tags }),
      ...(variants && {
        variants: variants.map(({ id: variantId, ...rest }) => ({ id: variantId, ...toThickness(rest) })),
      }),
      // `source` omitted: absent means catalog content (see Material.source)
    }),
  );

  bundledCatalogs[unit] = { materials, publishedAt: '2026-08-07T00:00:00Z', version: 0 };

  return bundledCatalogs[unit];
};
