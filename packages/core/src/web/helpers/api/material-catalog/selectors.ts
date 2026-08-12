import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import i18n from '@core/helpers/i18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type {
  Material,
  MaterialCategory,
  MaterialPreset,
  MaterialRegion,
  MaterialUserData,
  PresetValues,
} from '@core/interfaces/IMaterial';

import {
  getMaterialDisplayName,
  getPresetDisplayName,
  isMaterialVisibleInRegion,
  resolvePresetSettings,
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

/** Top-level grid entries: parents/standalones only, region-gated */
export const getVisibleMaterials = (materials: Material[], region: MaterialRegion): Material[] =>
  materials.filter((material) => !material.parentId && isMaterialVisibleInRegion(material, region));

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

/** Thickness variants of a material (its children), ordered by ascending thickness */
export const getVariants = (material: Material, allMaterials: Material[]): Material[] =>
  allMaterials
    .filter((candidate) => candidate.parentId === material.id)
    .sort((a, b) => (a.thicknessMm ?? 0) - (b.thicknessMm ?? 0));

const resolveOverlay = (
  overrides: MaterialUserData['presetOverrides'],
  presetId: string,
  model: PresetModel,
  module: LayerModuleType,
): null | (PresetValues & { name?: string }) => {
  const overlay = overrides[presetId];

  if (!overlay) return null;

  return resolvePresetSettings(overlay as MaterialPreset['settings'], model, module);
};

/**
 * One material's preset rows for the active machine context (own presets + user additions).
 * Composition across materials (e.g. variant rows followed by parent rows) is the caller's call.
 */
export const getPresetsForContext = (
  material: Material,
  model: PresetModel,
  module: LayerModuleType,
  userData: Pick<MaterialUserData, 'disabledPresetIds' | 'presetAdditions' | 'presetOverrides'>,
): ResolvedPresetRow[] => {
  const presets = [...material.presets, ...(userData.presetAdditions?.[material.id] ?? [])];
  const disabled = new Set(userData.disabledPresetIds);
  const rows: ResolvedPresetRow[] = [];

  for (const preset of presets) {
    const base = resolvePresetSettings(preset.settings, model, module);

    if (!base) continue;

    const overlay =
      preset.origin === 'default' ? resolveOverlay(userData.presetOverrides, preset.id, model, module) : null;
    const { name: overlayName, ...overlayValues } = overlay ?? {};

    rows.push({
      displayName: overlayName ?? getPresetDisplayName(preset),
      isDisabled: disabled.has(preset.id),
      legacyKey: preset.legacyKey,
      materialId: material.id,
      preset,
      presetId: preset.id,
      state: preset.origin === 'user' ? 'user' : overlay ? 'customized' : 'default',
      values: { ...base, ...overlayValues },
    });
  }

  return rows;
};
