import type { Material, MaterialUserData } from '@core/interfaces/IMaterial';

import type { MaterialStoreState } from './types';

let idCounter = 0;

/** Locally-unique id for user materials/presets */
export const generateUserId = (prefix: 'user' | 'user_mat' = 'user'): string =>
  `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const toUserData = (
  state: Pick<
    MaterialStoreState,
    'disabledPresetIds' | 'migratedFromPresets' | 'presetAdditions' | 'presetOverrides' | 'userMaterials'
  >,
): MaterialUserData => ({
  disabledPresetIds: state.disabledPresetIds,
  migratedFromPresets: state.migratedFromPresets,
  presetAdditions: state.presetAdditions,
  presetOverrides: state.presetOverrides,
  userMaterials: state.userMaterials,
  version: 1,
});

/** A material and all of its variant children */
export const withChildren = (materialId: string, materials: Material[]): Material[] =>
  materials.filter(({ id, parentId }) => id === materialId || parentId === materialId);
