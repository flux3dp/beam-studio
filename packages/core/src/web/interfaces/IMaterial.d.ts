import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import type { ConfigKeyTypeMap, PresetModel } from '@core/interfaces/ILayerConfig';

export type MaterialCategory =
  | 'acrylic'
  | 'glass'
  | 'leather'
  | 'metal'
  | 'other'
  | 'paper'
  | 'plastic'
  | 'rubber'
  | 'stone'
  | 'wood';

export type MaterialRegion = 'eu' | 'global' | 'jp' | 'tw' | 'us';

/**
 * Client-side ownership: 'default' = catalog content (read-only, FLUX-curated),
 * 'user' = locally created (fully editable). Finer provenance (shop/region-pack)
 * is a flux-id admin concern and is not serialized to clients.
 */
export type MaterialSource = 'default' | 'user';

/**
 * Display string that may carry per-language variants (cloud payloads).
 * Bundled catalog entries use `nameKey` (i18n) instead; user content uses a plain string.
 * Language codes follow Beam Studio's `active-lang` values (en, zh-tw, ja, de, ...).
 */
export type LocalizedString = (Partial<Record<string, string>> & { default: string }) | string;

/**
 * Parameter values of one preset scope. Same value shape as today's `Preset`,
 * with `dpi` promoted to a first-class parameter (option string, see resolutions.ts;
 * 'medium' = 250 DPI).
 */
export type PresetValues = Partial<ConfigKeyTypeMap> & {
  dpi?: EngraveDpiOption;
  /** Per-dpi deltas merged on top of the base values at apply time (same semantics as Preset.dpiOverrides) */
  dpiOverrides?: Partial<Record<EngraveDpiOption, Partial<ConfigKeyTypeMap>>>;
};

/** '*' = applies to any machine model (user presets, legacy migrations) */
export type PresetScopeKey = '*' | PresetModel;

/** '*' = applies to any layer module. Numeric LayerModule values serialize as their string form in JSON keys. */
export type PresetModuleKey = '*' | `${LayerModuleType}`;

export interface MaterialPreset {
  /**
   * Stable id. FLUX-assigned for catalog presets and immutable across catalog updates
   * (an edited default resolves back to its original by this id for Restore).
   * Migrated built-ins reuse their presets.ts key. Locally generated for user presets.
   */
  id: string;
  /** presets.ts key this preset derives from; kept for legacy configName compatibility + tutorial hooks */
  legacyKey?: string;
  /** Cloud/user presets carry the name directly */
  name?: LocalizedString;
  /** Bundled presets resolve the name through i18n (beambox.material_browser.catalog.presets.*) */
  nameKey?: string;
  origin: 'default' | 'user';
  /**
   * Parameter values scoped by machine model then layer module.
   * Resolution order: [model][module] → [model]['*'] → ['*'][module] → ['*']['*'].
   * A preset whose only scopes are printing modules never resolves for a non-printing
   * module (mirrors the legacy getPresetsList guard).
   */
  settings: Partial<Record<PresetScopeKey, Partial<Record<PresetModuleKey, PresetValues>>>>;
}

export interface Material {
  category: MaterialCategory;
  /** Cover color (hex) used when no image is set; default cover mode for user materials */
  coverColor?: string;
  description?: LocalizedString;
  descriptionKey?: string;
  id: string;
  /** Hero photo: absolute CDN URL (cloud), bundled asset path, or dataURL (user photo) */
  image?: string;
  name?: LocalizedString;
  /** Bundled materials resolve the name through i18n (beambox.material_browser.catalog.materials.*) */
  nameKey?: string;
  /** When set, this material is a variant of the parent: hidden from the top-level grid, shown in the parent's detail view */
  parentId?: string;
  presets: MaterialPreset[];
  /** Regions where this material is visible; default ['global'] (visible everywhere) */
  regions?: MaterialRegion[];
  /** Per-region FLUX Shop links; shown only when the viewer's active region has an entry. Cloud-curated, never user-editable. */
  shopLinks?: Partial<Record<Exclude<MaterialRegion, 'global'>, string>>;
  /** Absent in cloud/bundled payloads (implied 'default'); 'user' marks locally-owned editable content */
  source?: MaterialSource;
  tags?: string[];
  /** Exact decimal inches; display rounds to the nearest standard fraction */
  thicknessInch?: number;
  thicknessMm?: number;
}

/**
 * The catalog envelope. This shape is shared by:
 * - the bundled offline snapshot (built from presets.ts at runtime, version 0)
 * - the FLUX Cloud REST response (see docs/material-catalog-api.md)
 */
export interface MaterialCatalog {
  materials: Material[];
  /** ISO 8601 publish timestamp */
  publishedAt: string;
  /** Monotonic integer; bundled snapshot is 0, any cloud version >= 1 supersedes it */
  version: number;
}

/** User-owned data persisted under the `materials` storage key (never mixed into the catalog) */
export interface MaterialUserData {
  /** Preset ids hidden from the browser + layer-panel quick pick */
  disabledPresetIds: string[];
  /** One-way migration from the legacy 'presets' storage key has run */
  migratedFromPresets: boolean;
  /** User-created (origin: 'user') presets attached to CATALOG materials, keyed by material id */
  presetAdditions?: Record<string, MaterialPreset[]>;
  /**
   * Edits applied on top of `origin: 'default'` catalog presets ([Customized] state),
   * keyed by preset id. Restore = delete the entry. `name` override lives beside the values.
   */
  presetOverrides: Record<
    string,
    Partial<Record<PresetScopeKey, Partial<Record<PresetModuleKey, PresetValues & { name?: string }>>>>
  >;
  /** Materials created by the user (source: 'user'), including the "My Materials" bucket */
  userMaterials: Material[];
  version: 1;
}

export interface MaterialRecentEntry {
  materialId: string;
  presetId: string;
  timestamp: number;
}
