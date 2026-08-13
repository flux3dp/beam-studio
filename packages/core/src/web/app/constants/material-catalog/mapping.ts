import type { MaterialCategory } from '@core/interfaces/IMaterial';

/**
 * Hand-authored curation layer that groups the flat presets.ts keys into Materials
 * (PRD §9). Parameter values are NOT duplicated here — getBundledCatalog() pulls them
 * from presets.ts at build time, so the two can never drift.
 */

export interface BundledVariantDef {
  id: string;
  /**
   * Curated marketing fraction [numerator, denominator] from the legacy inch dropdown
   * labels (3mm → [1, 8] = ⅛″; 8mm corrected to [5, 16]), NOT a mm conversion.
   * A generated variant carries ONE authoritative unit — the builder emits either this
   * fraction or thicknessMm, picked by the user's default-units.
   */
  thicknessInch?: [number, number];
  thicknessMm?: number;
}

export interface BundledMaterialDef {
  category: MaterialCategory;
  id: string;
  /** i18n key under beambox.material_browser.catalog.materials.* */
  nameKey: string;
  tags?: string[];
  /** Thickness variants (one level only) — ALL thickness lives here, single-thickness materials get one variant */
  variants?: BundledVariantDef[];
}

export interface PresetMapping {
  /** Target material id from materialDefs */
  materialId: string;
  /** i18n key under beambox.material_browser.catalog.presets.* */
  nameKey: string;
  /** Scopes the preset to one variant; absent = applies to the whole material */
  variantId?: string;
}

/* eslint-disable perfectionist/sort-objects */
export const materialDefs: BundledMaterialDef[] = [
  // Wood
  {
    id: 'wood',
    nameKey: 'wood',
    category: 'wood',
    variants: [
      { id: 'wood-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'wood-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'wood-7mm', thicknessMm: 7, thicknessInch: [1, 4] },
      { id: 'wood-8mm', thicknessMm: 8, thicknessInch: [5, 16] },
      { id: 'wood-10mm', thicknessMm: 10, thicknessInch: [3, 8] },
    ],
  },
  {
    id: 'mdf',
    nameKey: 'mdf',
    category: 'wood',
    variants: [
      { id: 'mdf-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'mdf-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'mdf-7mm', thicknessMm: 7, thicknessInch: [1, 4] },
    ],
  },
  {
    id: 'bamboo',
    nameKey: 'bamboo',
    category: 'wood',
    variants: [
      { id: 'bamboo-2mm', thicknessMm: 2, thicknessInch: [5, 64] },
      { id: 'bamboo-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'cork', nameKey: 'cork', category: 'wood' },
  // Acrylic
  {
    id: 'acrylic',
    nameKey: 'acrylic',
    category: 'acrylic',
    variants: [
      { id: 'acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'acrylic-7mm', thicknessMm: 7, thicknessInch: [1, 4] },
      { id: 'acrylic-8mm', thicknessMm: 8, thicknessInch: [5, 16] },
      { id: 'acrylic-10mm', thicknessMm: 10, thicknessInch: [3, 8] },
    ],
  },
  {
    id: 'black-acrylic',
    nameKey: 'black_acrylic',
    category: 'acrylic',
    variants: [
      { id: 'black-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'black-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'opaque-acrylic', nameKey: 'opaque_acrylic', category: 'acrylic' },
  // Leather
  {
    id: 'leather',
    nameKey: 'leather',
    category: 'leather',
    variants: [
      { id: 'leather-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'leather-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'gloss-leather', nameKey: 'gloss_leather', category: 'leather' },
  // Fabric-like (no dedicated category; PRD fixed set → other)
  {
    id: 'fabric',
    nameKey: 'fabric',
    category: 'other',
    variants: [
      { id: 'fabric-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'fabric-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'denim',
    nameKey: 'denim',
    category: 'other',
    variants: [{ id: 'denim-1mm', thicknessMm: 1, thicknessInch: [1, 32] }],
  },
  { id: 'canvas', nameKey: 'canvas', category: 'other' },
  { id: 'canvas-fabric', nameKey: 'canvas_fabric', category: 'other' },
  // Paper
  { id: 'sticker', nameKey: 'sticker', category: 'paper' },
  { id: 'cardstock', nameKey: 'cardstock', category: 'paper' },
  { id: 'cardboard', nameKey: 'cardboard', category: 'paper' },
  // Glass / stone / rubber
  { id: 'glass', nameKey: 'glass', category: 'glass' },
  { id: 'slate', nameKey: 'slate', category: 'stone' },
  { id: 'stone', nameKey: 'stone', category: 'stone' },
  { id: 'rubber', nameKey: 'rubber', category: 'rubber' },
  // Metal
  { id: 'metal', nameKey: 'metal', category: 'metal' },
  { id: 'stainless-steel', nameKey: 'stainless_steel', category: 'metal' },
  { id: 'aluminum', nameKey: 'aluminum', category: 'metal' },
  { id: 'gold', nameKey: 'gold', category: 'metal' },
  { id: 'brass', nameKey: 'brass', category: 'metal' },
  { id: 'titanium', nameKey: 'titanium', category: 'metal' },
  { id: 'silver', nameKey: 'silver', category: 'metal' },
  { id: 'iron', nameKey: 'iron', category: 'metal' },
  { id: 'copper', nameKey: 'copper', category: 'metal' },
  // Plastic
  { id: 'white-abs', nameKey: 'white_abs', category: 'plastic' },
  { id: 'black-abs', nameKey: 'black_abs', category: 'plastic' },
  { id: 'pc', nameKey: 'pc', category: 'plastic' },
];

/**
 * Every presets.ts key mapped exactly once (enforced by unit test).
 * Order within a material follows insertion order here.
 */
export const presetMappings: Record<string, PresetMapping> = {
  // Wood
  wood_3mm_cutting: { materialId: 'wood', variantId: 'wood-3mm', nameKey: 'cutting' },
  wood_5mm_cutting: { materialId: 'wood', variantId: 'wood-5mm', nameKey: 'cutting' },
  wood_7mm_cutting: { materialId: 'wood', variantId: 'wood-7mm', nameKey: 'cutting' },
  wood_8mm_cutting: { materialId: 'wood', variantId: 'wood-8mm', nameKey: 'cutting' },
  wood_10mm_cutting: { materialId: 'wood', variantId: 'wood-10mm', nameKey: 'cutting' },
  wood_engraving: { materialId: 'wood', nameKey: 'engraving' },
  wood_printing: { materialId: 'wood', nameKey: 'printing' },
  mdf_3mm_cutting: { materialId: 'mdf', variantId: 'mdf-3mm', nameKey: 'cutting' },
  mdf_5mm_cutting: { materialId: 'mdf', variantId: 'mdf-5mm', nameKey: 'cutting' },
  mdf_7mm_cutting: { materialId: 'mdf', variantId: 'mdf-7mm', nameKey: 'cutting' },
  mdf_engraving: { materialId: 'mdf', nameKey: 'engraving' },
  mdf_printing: { materialId: 'mdf', nameKey: 'printing' },
  bamboo_2mm_cutting: { materialId: 'bamboo', variantId: 'bamboo-2mm', nameKey: 'cutting' },
  bamboo_5mm_cutting: { materialId: 'bamboo', variantId: 'bamboo-5mm', nameKey: 'cutting' },
  bamboo_printing: { materialId: 'bamboo', nameKey: 'printing' },
  cork_printing: { materialId: 'cork', nameKey: 'printing' },
  // Acrylic
  acrylic_3mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-3mm', nameKey: 'cutting' },
  acrylic_5mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-5mm', nameKey: 'cutting' },
  acrylic_7mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-7mm', nameKey: 'cutting' },
  acrylic_8mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-8mm', nameKey: 'cutting' },
  acrylic_10mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-10mm', nameKey: 'cutting' },
  acrylic_engraving: { materialId: 'acrylic', nameKey: 'engraving' },
  acrylic_printing: { materialId: 'acrylic', nameKey: 'printing' },
  black_acrylic_3mm_cutting: { materialId: 'black-acrylic', variantId: 'black-acrylic-3mm', nameKey: 'cutting' },
  black_acrylic_5mm_cutting: { materialId: 'black-acrylic', variantId: 'black-acrylic-5mm', nameKey: 'cutting' },
  black_acrylic_engraving: { materialId: 'black-acrylic', nameKey: 'engraving' },
  opaque_acrylic: { materialId: 'opaque-acrylic', nameKey: 'marking' },
  // Leather
  leather_3mm_cutting: { materialId: 'leather', variantId: 'leather-3mm', nameKey: 'cutting' },
  leather_5mm_cutting: { materialId: 'leather', variantId: 'leather-5mm', nameKey: 'cutting' },
  leather_engraving: { materialId: 'leather', nameKey: 'engraving' },
  leather_printing: { materialId: 'leather', nameKey: 'printing' },
  gloss_leather_printing: { materialId: 'gloss-leather', nameKey: 'printing' },
  // Fabric-like
  fabric_3mm_cutting: { materialId: 'fabric', variantId: 'fabric-3mm', nameKey: 'cutting' },
  fabric_5mm_cutting: { materialId: 'fabric', variantId: 'fabric-5mm', nameKey: 'cutting' },
  fabric_engraving: { materialId: 'fabric', nameKey: 'engraving' },
  fabric_printing: { materialId: 'fabric', nameKey: 'printing' },
  denim_1mm_cutting: { materialId: 'denim', variantId: 'denim-1mm', nameKey: 'cutting' },
  canvas_printing: { materialId: 'canvas', nameKey: 'printing' },
  canvas_fabric_printing: { materialId: 'canvas-fabric', nameKey: 'printing' },
  // Paper
  sticker_kiss_cut: { materialId: 'sticker', nameKey: 'kiss_cut' },
  sticker_printing: { materialId: 'sticker', nameKey: 'printing' },
  cardstock_printing: { materialId: 'cardstock', nameKey: 'printing' },
  cardboard_printing: { materialId: 'cardboard', nameKey: 'printing' },
  // Glass / stone / rubber
  glass_bw_engraving: { materialId: 'glass', nameKey: 'engraving' },
  glass_printing: { materialId: 'glass', nameKey: 'printing' },
  slate_engraving: { materialId: 'slate', nameKey: 'engraving' },
  stone: { materialId: 'stone', nameKey: 'marking' },
  flat_stone_printing: { materialId: 'stone', nameKey: 'printing' },
  rubber_bw_engraving: { materialId: 'rubber', nameKey: 'engraving' },
  // Metal
  metal_bw_engraving: { materialId: 'metal', nameKey: 'engraving' },
  steel_engraving_spray_engraving: { materialId: 'metal', nameKey: 'engraving_spray' },
  metal_engraving: { materialId: 'metal', nameKey: 'marking' },
  stainless_steel_bw_engraving_diode: { materialId: 'stainless-steel', nameKey: 'engraving_diode' },
  stainless_steel_engraving: { materialId: 'stainless-steel', nameKey: 'engraving_fiber' },
  stainless_steel_light: { materialId: 'stainless-steel', nameKey: 'marking_light' },
  stainless_steel_dark: { materialId: 'stainless-steel', nameKey: 'marking_dark' },
  stainless_steel_printing: { materialId: 'stainless-steel', nameKey: 'printing' },
  aluminum_engraving: { materialId: 'aluminum', nameKey: 'engraving_fiber' },
  aluminum_light: { materialId: 'aluminum', nameKey: 'marking_light' },
  gold_engraving: { materialId: 'gold', nameKey: 'engraving_fiber' },
  brass_engraving: { materialId: 'brass', nameKey: 'engraving_fiber' },
  brass_light: { materialId: 'brass', nameKey: 'marking_light' },
  brass_dark: { materialId: 'brass', nameKey: 'marking_dark' },
  ti_engraving: { materialId: 'titanium', nameKey: 'engraving_fiber' },
  titanium_light: { materialId: 'titanium', nameKey: 'marking_light' },
  titanium_dark: { materialId: 'titanium', nameKey: 'marking_dark' },
  silver_engraving: { materialId: 'silver', nameKey: 'engraving_fiber' },
  iron_engraving: { materialId: 'iron', nameKey: 'engraving_fiber' },
  copper: { materialId: 'copper', nameKey: 'marking' },
  // Plastic
  white_abs: { materialId: 'white-abs', nameKey: 'marking' },
  black_abs: { materialId: 'black-abs', nameKey: 'marking' },
  pc_printing: { materialId: 'pc', nameKey: 'printing' },
};
/* eslint-enable perfectionist/sort-objects */
