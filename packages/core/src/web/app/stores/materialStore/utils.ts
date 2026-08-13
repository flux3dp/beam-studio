import type { MaterialUserData } from '@core/interfaces/IMaterial';

import type { MaterialStoreState } from './types';

let idCounter = 0;

/** Locally-unique id for user materials/variants/presets */
export const generateUserId = (prefix: 'user' | 'user_mat' | 'user_var' = 'user'): string =>
  `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const toUserData = (
  state: Pick<
    MaterialStoreState,
    'disabledPresetIds' | 'migratedFromPresets' | 'presetOverrides' | 'userMaterials' | 'userPresets' | 'userVariants'
  >,
): MaterialUserData => ({
  disabledPresetIds: state.disabledPresetIds,
  migratedFromPresets: state.migratedFromPresets,
  presetOverrides: state.presetOverrides,
  userMaterials: state.userMaterials,
  userPresets: state.userPresets,
  userVariants: state.userVariants,
  version: 1,
});
