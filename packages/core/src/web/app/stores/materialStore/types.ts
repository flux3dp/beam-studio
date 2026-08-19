import type {
  Material,
  MaterialPreset,
  MaterialRecentEntry,
  MaterialUserData,
  MaterialVariant,
  PresetValues,
  UserPreset,
  UserVariant,
} from '@core/interfaces/IMaterial';
import type { PresetModuleKey, PresetScopeKey } from '@core/interfaces/IMaterial';

export interface MaterialLibraryExport {
  disabledPresetIds: string[];
  presetOverrides: MaterialUserData['presetOverrides'];
  type: 'flux-material-library';
  userMaterials: Material[];
  userPresets: UserPreset[];
  userVariants: UserVariant[];
  version: 1;
}

export interface MaterialStoreState {
  disabledPresetIds: string[];
  favorites: string[];
  migratedFromPresets: boolean;
  presetOverrides: MaterialUserData['presetOverrides'];
  recents: MaterialRecentEntry[];
  /** User materials never embed presets or variants; those live in the flat lists below */
  userMaterials: Material[];
  /** All user presets, flat; owner = materialId (catalog or user material) */
  userPresets: UserPreset[];
  /** All user-added thickness variants, flat; owner = materialId (catalog or user material) */
  userVariants: UserVariant[];
}

export interface MaterialStoreActions {
  addMaterial: (material: Material) => void;
  addPreset: (materialId: string, preset: MaterialPreset) => void;
  addVariant: (materialId: string, variant: MaterialVariant) => void;
  deleteMaterial: (materialId: string) => void;
  deletePreset: (presetId: string) => void;
  deleteVariant: (variantId: string) => void;
  /** Deep-copies a catalog material (variants included) into an editable user material */
  duplicateMaterial: (source: Material, name?: string) => Material;
  /** Lazily creates and returns the "My Materials" bucket */
  ensureBucket: () => Material;
  getExportData: () => MaterialLibraryExport;
  importData: (data: Partial<MaterialLibraryExport>) => void;
  /** Re-files a user preset onto another material (id unchanged, layer refs stay valid) */
  movePreset: (presetId: string, targetMaterialId: string) => void;
  pushRecent: (materialId: string, presetId: string) => void;
  restorePreset: (presetId: string) => void;
  toggleFavorite: (materialId: string) => void;
  togglePresetDisabled: (presetId: string) => void;
  updateMaterial: (materialId: string, patch: Partial<Material>) => void;
  /**
   * Edits preset values for one machine/module scope. User presets (found in userPresets)
   * are replaced in the flat list; catalog defaults get a presetOverrides overlay ([Customized]).
   */
  updatePreset: (
    presetId: string,
    scope: PresetScopeKey,
    moduleKey: PresetModuleKey,
    values: PresetValues & { name?: string },
  ) => void;
}

export type MaterialStore = MaterialStoreActions & MaterialStoreState;
