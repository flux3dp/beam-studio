import type { Preset } from '@core/interfaces/ILayerConfig';
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

/** Export file = the persisted user data plus a type tag */
export type MaterialLibraryExport = MaterialUserData & { type: 'flux-material-library' };

export interface MaterialStoreState {
  disabledPresetIds: string[];
  favorites: string[];
  migratedFromPresets: boolean;
  pinnedVariantIds: string[];
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
  /** Merges a legacy `presets` array (storage or exported file) into the "My Materials" bucket */
  importLegacyPresets: (legacy: Preset[] | undefined) => void;
  /** Re-files a user preset onto another material and optional thickness scope (id unchanged, layer refs stay valid) */
  movePreset: (presetId: string, targetMaterialId: string, targetVariantId?: string) => void;
  /** Keeps a catalog variant listed regardless of machine presets; undone by deleteVariant */
  pinVariant: (variantId: string) => void;
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
