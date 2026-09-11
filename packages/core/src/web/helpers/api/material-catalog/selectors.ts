import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { dpiValueMap } from '@core/app/constants/resolutions';
import i18n from '@core/helpers/i18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type {
  Material,
  MaterialCategory,
  MaterialPreset,
  MaterialRegion,
  MaterialUserData,
  MaterialVariant,
  PresetValues,
  UserVariant,
} from '@core/interfaces/IMaterial';

import {
  getMaterialDisplayName,
  getPresetDisplayName,
  isMaterialVisibleInRegion,
  resolvePresetOverlay,
  resolvePresetValues,
} from './utils';

export type PresetState = 'customized' | 'default' | 'user';

export interface ResolvedPresetRow {
  displayName: string;
  isDisabled: boolean;
  legacyKey?: string;
  materialId: string;
  preset: MaterialPreset;
  presetId: string;
  state: PresetState;
  /** Base values merged with the user's customized overlay (if any) */
  values: PresetValues;
}

/** Region-gated grid entries (variants live inside their material, never top-level) */
export const getVisibleMaterials = (materials: Material[], region: MaterialRegion): Material[] =>
  materials.filter((material) => isMaterialVisibleInRegion(material, region));

export const getMaterialsByCategory = (materials: Material[], category: MaterialCategory): Material[] =>
  materials.filter((material) => material.category === category);

/** Live search across resolved display name, tags, and category */
export const searchMaterials = (materials: Material[], query: string): Material[] => {
  const q = query.trim().toLowerCase();

  if (!q) return materials;

  return materials.filter(
    (material) =>
      getMaterialDisplayName(material).toLowerCase().includes(q) ||
      material.category.includes(q) ||
      i18n.lang.beambox.material_browser.categories[material.category].toLowerCase().includes(q) ||
      material.tags?.some((tag) => tag.toLowerCase().includes(q)),
  );
};

/** Numeric thickness in its own unit (fraction resolved) */
const thicknessValue = ({ thicknessDen, thicknessNum }: MaterialVariant): number =>
  (thicknessNum ?? 0) / (thicknessDen ?? 1);

/**
 * A material's effective variants for display: catalog variants ∪ user-added ones,
 * mm variants first, then inch, each ascending.
 */
export const getSortedVariants = (material: Material, userVariants: UserVariant[]): MaterialVariant[] =>
  [...(material.variants ?? []), ...userVariants.filter(({ materialId }) => materialId === material.id)].sort(
    (a, b) =>
      Number(a.thicknessUnit === 'inch') - Number(b.thicknessUnit === 'inch') || thicknessValue(a) - thicknessValue(b),
  );

/**
 * The variants the browser lists for the active machine: catalog variants only when a preset
 * scoped to them resolves here (or the user pinned them), user-added variants always.
 * Sorted like getSortedVariants.
 */
export const getVisibleVariants = (
  material: Material,
  model: PresetModel,
  module: LayerModuleType,
  userData: Pick<
    MaterialUserData,
    'disabledPresetIds' | 'pinnedVariantIds' | 'presetOverrides' | 'userPresets' | 'userVariants'
  >,
): MaterialVariant[] => {
  const variants = getSortedVariants(material, userData.userVariants);
  const userVariantIds = new Set([...userData.pinnedVariantIds, ...userData.userVariants.map(({ id }) => id)]);
  const presets = getPresetsForContext(material, model, module, userData);

  return variants.filter(
    (variant) => userVariantIds.has(variant.id) || presets.some((preset) => preset.preset.variantId === variant.id),
  );
};

/**
 * One material's preset rows for the active machine context (own presets + user additions).
 * With `variantId`, variant-scoped presets are filtered to that variant; material-wide
 * presets (no variantId) always show. Without it, every preset of the material is listed
 * (support checks, row lookups).
 */
export const getPresetsForContext = (
  material: Material,
  model: PresetModel,
  module: LayerModuleType,
  userData: Pick<MaterialUserData, 'disabledPresetIds' | 'presetOverrides' | 'userPresets'>,
  variantId?: string,
): ResolvedPresetRow[] => {
  const presets = [
    ...material.presets,
    ...userData.userPresets.filter(({ materialId }) => materialId === material.id),
  ].filter((preset) => !variantId || !preset.variantId || preset.variantId === variantId);
  const disabled = new Set(userData.disabledPresetIds);
  const rows: ResolvedPresetRow[] = [];

  for (const preset of presets) {
    const values = resolvePresetValues(preset, userData.presetOverrides, model, module);

    if (!values) continue;

    const overlay =
      preset.origin === 'default' ? resolvePresetOverlay(userData.presetOverrides, preset.id, model, module) : null;
    const overlayName = overlay?.name;
    // Catalog dpi entries disambiguate by suffix IN THE BROWSER ONLY — the layer chip uses
    // getPresetDisplayName directly, so it keeps the plain name and never claims a DPI
    const displayName =
      overlayName ??
      (preset.origin === 'default' && values.dpi
        ? `${getPresetDisplayName(preset)} - ${dpiValueMap[values.dpi]} DPI`
        : getPresetDisplayName(preset));

    rows.push({
      displayName,
      isDisabled: disabled.has(preset.id),
      legacyKey: preset.legacyKey,
      materialId: material.id,
      preset,
      presetId: preset.id,
      state: preset.origin === 'user' ? 'user' : overlay ? 'customized' : 'default',
      values,
    });
  }

  return rows;
};
