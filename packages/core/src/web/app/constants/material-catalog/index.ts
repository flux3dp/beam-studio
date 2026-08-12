import { presets as defaultPresets } from '@core/app/constants/presets';
import { dpiValueMap, type EngraveDpiOption } from '@core/app/constants/resolutions';
import { useStorageStore } from '@core/app/stores/storageStore';
import type { Preset } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialCatalog, MaterialPreset, PresetValues } from '@core/interfaces/IMaterial';

import { materialDefs, presetMappings } from './mapping';

export { CATEGORY_COLORS, MATERIAL_CATEGORIES, MY_MATERIALS_ID, RECENTS_LIMIT } from './constants';
export { materialDefs, presetMappings } from './mapping';

/**
 * Strip legacy Preset metadata so only parameter values remain in a settings scope.
 *
 * `dpi` is only declared for scopes that carry dpiOverrides: their curated base values
 * are tuned for 250 DPI, and the browser surfaces the override tiers as separate
 * "(Quality)" entries (D19), so DPI becomes part of the choice. Scopes without
 * overrides declare nothing — applying them leaves the layer's DPI untouched,
 * exactly like the legacy dropdown.
 */
const toPresetValues = (preset: Preset, dpi?: EngraveDpiOption): PresetValues => {
  const { hide: _hide, isDefault: _isDefault, key: _key, module: _module, name: _name, ...values } = preset;

  return preset.dpiOverrides && dpi ? { dpi, ...values } : values;
};

/** Override tiers above the curated 250 DPI base, ascending (e.g. high → detailed → ultra) */
const getQualityOptions = (source: NonNullable<(typeof defaultPresets)[string]>): EngraveDpiOption[] => {
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

    const source = defaultPresets[key];

    if (!source) continue;

    const settings: MaterialPreset['settings'] = {};

    for (const [model, modules] of Object.entries(source)) {
      for (const [moduleKey, preset] of Object.entries(modules!)) {
        (settings[model as keyof typeof settings] ??= {})[moduleKey as '*'] = toPresetValues(preset, 'medium');
      }
    }

    result.push({ id: key, legacyKey: key, nameKey: mapping.nameKey, origin: 'default', settings });

    // D19: each override tier above the base becomes its own "(Quality)" entry, scoped to
    // the models that actually curate that tier. Values (incl. dpiOverrides) stay identical
    // to the base — only `dpi` differs, so applying still resolves through the same override
    // mechanism and later DPI changes keep their compensation.
    for (const option of getQualityOptions(source)) {
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
        id: `${key}_${option}`,
        nameKey: 'engraving_quality',
        origin: 'default',
        settings: qualitySettings,
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

  const materials: Material[] = materialDefs.map(
    ({ category, id, nameKey, parentId, tags, thicknessInch, thicknessMm }) => {
      const thickness = isInch
        ? thicknessInch && { thicknessDen: thicknessInch[1], thicknessNum: thicknessInch[0], thicknessUnit: unit }
        : thicknessMm !== undefined && { thicknessNum: thicknessMm, thicknessUnit: unit };

      return {
        category,
        id,
        nameKey,
        ...(parentId && { parentId }),
        presets: buildPresetsForMaterial(id),
        ...(tags && { tags }),
        ...thickness,
        // `source` omitted: absent means catalog content (see Material.source)
      };
    },
  );

  bundledCatalogs[unit] = { materials, publishedAt: '2026-08-07T00:00:00Z', version: 0 };

  return bundledCatalogs[unit];
};
