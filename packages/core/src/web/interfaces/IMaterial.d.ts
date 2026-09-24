import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import type { ConfigKeyTypeMap, PresetModel } from '@core/interfaces/ILayerConfig';

export type MaterialCategory = 'acrylic' | 'leather' | 'metal' | 'other' | 'paper' | 'plastic' | 'wood';

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
export type PresetValues = Partial<ConfigKeyTypeMap> & { dpi?: EngraveDpiOption };

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
  /**
   * Links the flat per-DPI presets of one family (base + quality options share the base's
   * id as groupId). When the layer DPI changes, the client switches to the group member
   * declaring the new dpi (see switchPresetDpiGroup). Absent on single-DPI presets.
   */
  groupId?: string;
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
  /** Scopes the preset to one variant of its material; absent = applies to the whole material */
  variantId?: string;
}

/**
 * A thickness variant of a material (its own presets scope in via MaterialPreset.variantId).
 * Deliberately NOT a Material: variants never appear in the grid, never nest further, and
 * share the material's name/category/tags.
 *
 * Thickness is a fraction in the variant's ONE authoritative unit (metric catalog: mm;
 * US shop: inch). `num`/`den` store the marketed fraction exactly — ⅛″ is num 1, den 8 —
 * so display never rounds. `den` defaults to 1 (metric values are effectively `num` mm).
 */
export interface MaterialVariant {
  id: string;
  /** Variant-specific hero photo; falls back to the material's */
  image?: string;
  thicknessDen?: number;
  thicknessNum?: number;
  thicknessUnit?: 'inch' | 'mm';
}

/** A user-created preset in the flat user-data list; materialId points at its catalog or user material */
export interface UserPreset extends MaterialPreset {
  materialId: string;
}

/** A user-added thickness variant in the flat user-data list; materialId points at its catalog or user material */
export interface UserVariant extends MaterialVariant {
  materialId: string;
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
  presets: MaterialPreset[];
  /** Regions where this material is visible; default ['global'] (visible everywhere) */
  regions?: MaterialRegion[];
  /** Per-region FLUX Shop links; shown only when the viewer's active region has an entry. Cloud-curated, never user-editable. */
  shopLinks?: Partial<Record<Exclude<MaterialRegion, 'global'>, string>>;
  /** Absent in cloud/bundled payloads (implied 'default'); 'user' marks locally-owned editable content */
  source?: MaterialSource;
  tags?: string[];
  /**
   * CATALOG thickness variants shown in the detail view's switcher; one level, never
   * standalone. Thickness lives ONLY on variants — a single-thickness material (e.g.
   * 1mm denim) has one. User-added variants live in the flat userVariants list (a
   * material's effective variants = this ∪ userVariants by materialId), so stored
   * user materials keep this empty, like presets.
   */
  variants?: MaterialVariant[];
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
  /**
   * Catalog variant ids the user re-added: a catalog variant is only listed for machines
   * it has presets for, so these stay visible everywhere (until deleted, which also drops
   * the user presets scoped to them).
   */
  pinnedVariantIds: string[];
  /**
   * Edits applied on top of `origin: 'default'` catalog presets ([Customized] state),
   * keyed by preset id. Restore = delete the entry. `name` override lives beside the values.
   */
  presetOverrides: Record<
    string,
    Partial<Record<PresetScopeKey, Partial<Record<PresetModuleKey, PresetValues & { name?: string }>>>>
  >;
  /** Materials created by the user (source: 'user'), including the "My Materials" bucket; presets/variants always empty */
  userMaterials: Material[];
  /** All user-created presets, flat; attached to their material (catalog or user) via materialId */
  userPresets: UserPreset[];
  /** All user-added thickness variants, flat; attached to their material (catalog or user) via materialId */
  userVariants: UserVariant[];
  version: 1;
}

export interface MaterialRecentEntry {
  materialId: string;
  presetId: string;
  timestamp: number;
}
