import type {
  Material,
  MaterialPreset,
  MaterialRecentEntry,
  MaterialUserData,
  PresetValues,
} from '@core/interfaces/IMaterial';
import type { PresetModuleKey, PresetScopeKey } from '@core/interfaces/IMaterial';

export interface MaterialLibraryExport {
  disabledPresetIds: string[];
  presetAdditions: Record<string, MaterialPreset[]>;
  presetOverrides: MaterialUserData['presetOverrides'];
  type: 'flux-material-library';
  userMaterials: Material[];
  version: 1;
}

export interface MaterialStoreState {
  disabledPresetIds: string[];
  favorites: string[];
  migratedFromPresets: boolean;
  /** User presets attached to catalog materials, keyed by material id */
  presetAdditions: Record<string, MaterialPreset[]>;
  presetOverrides: MaterialUserData['presetOverrides'];
  recents: MaterialRecentEntry[];
  userMaterials: Material[];
}

export interface MaterialStoreActions {
  addMaterial: (material: Material) => void;
  addPreset: (materialId: string, preset: MaterialPreset) => void;
  deleteMaterial: (materialId: string) => void;
  deletePreset: (materialId: string, presetId: string) => void;
  /** Deep-copies a catalog material (with its variants) into an editable user material */
  duplicateMaterial: (source: Material, variants?: Material[]) => Material;
  /** Lazily creates and returns the "My Materials" bucket */
  ensureBucket: () => Material;
  getExportData: () => MaterialLibraryExport;
  importData: (data: Partial<MaterialLibraryExport>) => void;
  /** Re-files a user preset onto another material (id unchanged, layer refs stay valid) */
  movePreset: (materialId: string, presetId: string, targetMaterialId: string) => void;
  pushRecent: (materialId: string, presetId: string) => void;
  restorePreset: (presetId: string) => void;
  toggleFavorite: (materialId: string) => void;
  togglePresetDisabled: (presetId: string) => void;
  updateMaterial: (materialId: string, patch: Partial<Material>) => void;
  /**
   * Edits preset values for one machine/module scope. User presets (found on materialId)
   * are edited in place; catalog defaults get a presetOverrides overlay ([Customized]).
   */
  updatePreset: (
    materialId: string,
    presetId: string,
    scope: PresetScopeKey,
    moduleKey: PresetModuleKey,
    values: PresetValues & { name?: string },
  ) => void;
}

export type MaterialStore = MaterialStoreActions & MaterialStoreState;
