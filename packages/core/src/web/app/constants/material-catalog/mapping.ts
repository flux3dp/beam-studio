import type { Material, MaterialCategory, MaterialRegion } from '@core/interfaces/IMaterial';

/**
 * Hand-authored curation layer that groups the flat presets.ts keys into Materials
 * (PRD §9). Parameter values are NOT duplicated here — getBundledCatalog() pulls them
 * from presets.ts at build time, so the two can never drift.
 */

export interface BundledVariantDef {
  id: string;
  /**
   * Curated marketing fraction [numerator, denominator] from the legacy inch dropdown
   * labels (3mm → [1, 8] = ⅛″; 8mm corrected to [5, 16]; 7mm → [9, 32], the nearest 32nd,
   * so it stays distinct from 6mm = ¼″), NOT a mm conversion.
   * A generated variant carries ONE authoritative unit — the builder emits either this
   * fraction or thicknessMm, picked by the user's default-units.
   */
  thicknessInch?: [number, number];
  thicknessMm?: number;
}

export interface BundledMaterialDef {
  category: MaterialCategory;
  id: string;
  /** Cover photo basename under assets/img/material-catalog/ (no extension); absent = coverColor/category fallback */
  image?: string;
  /** i18n key under beambox.material_browser.catalog.materials.* */
  nameKey: string;
  /** Regions where this material is visible; absent = global (visible everywhere) */
  regions?: MaterialRegion[];
  /** Per-region FLUX Shop links (shown in the detail view when the viewer's region has one) */
  shopLinks?: Material['shopLinks'];
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

// TODO: confirm the TW shop links below against https://tw-shop.flux3dp.com/collections/materials
// (open: teak/poplar plywood unmapped, leather kits unmapped, mixed acrylic points at a search page)
const TW_SHOP = 'https://tw-shop.flux3dp.com';

/* eslint-disable perfectionist/sort-objects */
export const materialDefs: BundledMaterialDef[] = [
  // Wood
  {
    id: 'wood',
    nameKey: 'wood',
    image: 'wood_plywood',
    category: 'wood',
    shopLinks: { tw: `${TW_SHOP}/products/%E7%B4%A0%E9%9D%A2%E5%90%88%E6%9D%BF%E7%B3%BB%E5%88%97` },
    variants: [
      { id: 'wood-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'wood-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'wood-7mm', thicknessMm: 7, thicknessInch: [9, 32] },
      { id: 'wood-8mm', thicknessMm: 8, thicknessInch: [5, 16] },
      { id: 'wood-10mm', thicknessMm: 10, thicknessInch: [3, 8] },
    ],
  },
  {
    id: 'mdf',
    nameKey: 'mdf',
    image: 'mdf',
    category: 'wood',
    shopLinks: { tw: `${TW_SHOP}/products/mdf` },
    variants: [
      { id: 'mdf-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'mdf-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'mdf-7mm', thicknessMm: 7, thicknessInch: [9, 32] },
    ],
  },
  {
    id: 'solid-wood',
    nameKey: 'solid_wood',
    image: 'wood_solid',
    category: 'wood',
    variants: [
      { id: 'solid-wood-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'solid-wood-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'walnut-veneer',
    nameKey: 'walnut_veneer',
    image: 'wood_veneer',
    category: 'wood',
    regions: ['tw'],
    shopLinks: { tw: `${TW_SHOP}/products/%E8%83%A1%E6%A1%83%E5%90%88%E6%9D%BF%E7%B3%BB%E5%88%97` },
  },
  {
    id: 'basswood-sheet',
    nameKey: 'basswood_sheet',
    image: 'wood_basswood',
    category: 'wood',
    regions: ['tw'],
    shopLinks: { tw: `${TW_SHOP}/products/basswood` },
  },
  {
    id: 'bamboo',
    nameKey: 'bamboo',
    image: 'bamboo',
    category: 'wood',
    variants: [
      { id: 'bamboo-2mm', thicknessMm: 2, thicknessInch: [1, 16] },
      { id: 'bamboo-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'cork', nameKey: 'cork', image: 'cork', category: 'wood' },
  // Acrylic
  {
    id: 'acrylic',
    nameKey: 'acrylic',
    image: 'acrylic_transparent',
    category: 'acrylic',
    shopLinks: { tw: `${TW_SHOP}/products/3mm-%E5%A3%93%E5%85%8B%E5%8A%9B-40x30-%E5%85%AC%E5%88%86` },
    variants: [
      { id: 'acrylic-2mm', thicknessMm: 2, thicknessInch: [1, 16] },
      { id: 'acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
      { id: 'acrylic-6mm', thicknessMm: 6, thicknessInch: [1, 4] },
      { id: 'acrylic-7mm', thicknessMm: 7, thicknessInch: [9, 32] },
      { id: 'acrylic-8mm', thicknessMm: 8, thicknessInch: [5, 16] },
      { id: 'acrylic-10mm', thicknessMm: 10, thicknessInch: [3, 8] },
    ],
  },
  {
    id: 'black-acrylic',
    nameKey: 'black_acrylic',
    image: 'acrylic_opaque',
    category: 'acrylic',
    shopLinks: { tw: `${TW_SHOP}/products/3mm-%E5%A3%93%E5%85%8B%E5%8A%9B-40x30-%E5%85%AC%E5%88%86` },
    variants: [
      { id: 'black-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'black-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'opaque-acrylic',
    nameKey: 'opaque_acrylic',
    image: 'acrylic_opaque',
    category: 'acrylic',
    shopLinks: { tw: `${TW_SHOP}/products/3mm-%E5%A3%93%E5%85%8B%E5%8A%9B-40x30-%E5%85%AC%E5%88%86` },
  },
  {
    id: 'fluorescent-acrylic',
    nameKey: 'fluorescent_acrylic',
    image: 'acrylic_fluorescent',
    category: 'acrylic',
    regions: ['us'],
    variants: [
      { id: 'fluorescent-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'fluorescent-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'glitter-acrylic',
    nameKey: 'glitter_acrylic',
    image: 'acrylic_glitter',
    category: 'acrylic',
    regions: ['us'],
    variants: [
      { id: 'glitter-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'glitter-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'sublimation-acrylic',
    nameKey: 'sublimation_acrylic',
    image: 'acrylic_sublimation',
    category: 'acrylic',
    variants: [
      { id: 'sublimation-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'sublimation-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'mixed-acrylic',
    nameKey: 'mixed_acrylic',
    image: 'acrylic_mixed',
    category: 'acrylic',
    shopLinks: { tw: `${TW_SHOP}/search?type=product&q=%E6%B7%B7%E8%89%B2%E5%A3%93%E5%85%8B%E5%8A%9B` },
    variants: [
      { id: 'mixed-acrylic-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'mixed-acrylic-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'acrylic-with-film',
    nameKey: 'acrylic_with_film',
    image: 'acrylic_film',
    category: 'acrylic',
    variants: [
      { id: 'acrylic-with-film-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'acrylic-with-film-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'mirror-acrylic', nameKey: 'mirror_acrylic', image: 'acrylic_mirror', category: 'acrylic', regions: ['us'] },
  // Leather
  {
    id: 'leather',
    nameKey: 'leather',
    image: 'leather_genuine',
    category: 'leather',
    variants: [
      { id: 'leather-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'leather-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  { id: 'gloss-leather', nameKey: 'gloss_leather', image: 'leather_genuine', category: 'leather' },
  {
    id: 'faux-leather',
    nameKey: 'faux_leather',
    image: 'leather_faux',
    category: 'leather',
    variants: [{ id: 'faux-leather-3mm', thicknessMm: 3, thicknessInch: [1, 8] }],
  },
  // Fabric-like (no dedicated category; PRD fixed set → other)
  {
    id: 'fabric',
    nameKey: 'fabric',
    image: 'fabric',
    category: 'other',
    variants: [
      { id: 'fabric-3mm', thicknessMm: 3, thicknessInch: [1, 8] },
      { id: 'fabric-5mm', thicknessMm: 5, thicknessInch: [3, 16] },
    ],
  },
  {
    id: 'denim',
    nameKey: 'denim',
    image: 'fabric_denim',
    category: 'other',
    variants: [{ id: 'denim-1mm', thicknessMm: 1, thicknessInch: [1, 32] }],
  },
  { id: 'canvas', nameKey: 'canvas', image: 'fabric_canvas', category: 'other' },
  { id: 'felt', nameKey: 'felt', image: 'fabric_felt', category: 'other' },
  { id: 'eva-foam', nameKey: 'eva_foam', image: 'foam_eva', category: 'other' },
  // Paper
  { id: 'sticker', nameKey: 'sticker', image: 'sticker', category: 'paper' },
  { id: 'cardstock', nameKey: 'cardstock', image: 'paper_cardstock', category: 'paper' },
  { id: 'cardboard', nameKey: 'cardboard', image: 'paper_cardboard', category: 'paper' },
  { id: 'kraft-paper', nameKey: 'kraft_paper', image: 'paper_kraft', category: 'paper' },
  // Glass / stone / rubber
  { id: 'glass', nameKey: 'glass', image: 'glass', category: 'other' },
  { id: 'slate', nameKey: 'slate', image: 'stone_slate', category: 'other' },
  { id: 'stone', nameKey: 'stone', image: 'stone', category: 'other' },
  {
    id: 'rubber',
    nameKey: 'rubber',
    image: 'rubber',
    category: 'other',
    shopLinks: { tw: `${TW_SHOP}/products/%E7%84%A1%E6%AF%92%E7%84%A1%E8%87%AD%E5%8D%B0%E7%AB%A0%E5%A2%8A` },
  },
  { id: 'ceramic-tile', nameKey: 'ceramic_tile', image: 'ceramic', category: 'other', regions: ['tw'] },
  // Metal
  { id: 'metal', nameKey: 'metal', image: 'metal_general', category: 'metal' },
  { id: 'stainless-steel', nameKey: 'stainless_steel', image: 'metal_stainless', category: 'metal' },
  { id: 'aluminum', nameKey: 'aluminum', image: 'metal_aluminum', category: 'metal' },
  { id: 'gold', nameKey: 'gold', image: 'metal_gold', category: 'metal' },
  { id: 'brass', nameKey: 'brass', image: 'metal_brass', category: 'metal' },
  { id: 'titanium', nameKey: 'titanium', image: 'metal_titanium', category: 'metal' },
  { id: 'silver', nameKey: 'silver', image: 'metal_silver', category: 'metal' },
  { id: 'iron', nameKey: 'iron', image: 'metal_iron', category: 'metal' },
  { id: 'copper', nameKey: 'copper', image: 'metal_copper', category: 'metal' },
  // Plastic
  { id: 'white-abs', nameKey: 'white_abs', image: 'plastic_abs', category: 'plastic' },
  { id: 'black-abs', nameKey: 'black_abs', image: 'plastic_abs', category: 'plastic' },
  { id: 'pc', nameKey: 'pc', image: 'plastic_pc', category: 'plastic' },
];

/**
 * Legacy presets.ts keys the browser folds into another catalog preset: they stay in
 * presets.ts (the legacy dropdown still lists them) but are never built into the catalog, and
 * files saved with them resolve to the target's legacyKey. Extend whenever a key is merged.
 */
export const mergedLegacyKeys: Record<string, string> = { canvas_fabric_printing: 'canvas_printing' };

/**
 * Every presets.ts key mapped exactly once (enforced by unit test), except mergedLegacyKeys.
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
  wood_solid_3mm_cutting: { materialId: 'solid-wood', variantId: 'solid-wood-3mm', nameKey: 'cutting' },
  wood_solid_5mm_cutting: { materialId: 'solid-wood', variantId: 'solid-wood-5mm', nameKey: 'cutting' },
  wood_solid_engraving: { materialId: 'solid-wood', nameKey: 'engraving' },
  bamboo_2mm_cutting: { materialId: 'bamboo', variantId: 'bamboo-2mm', nameKey: 'cutting' },
  bamboo_5mm_cutting: { materialId: 'bamboo', variantId: 'bamboo-5mm', nameKey: 'cutting' },
  bamboo_printing: { materialId: 'bamboo', nameKey: 'printing' },
  cork_printing: { materialId: 'cork', nameKey: 'printing' },
  // Acrylic
  acrylic_2mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-2mm', nameKey: 'cutting' },
  acrylic_3mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-3mm', nameKey: 'cutting' },
  acrylic_5mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-5mm', nameKey: 'cutting' },
  acrylic_6mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-6mm', nameKey: 'cutting' },
  acrylic_7mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-7mm', nameKey: 'cutting' },
  acrylic_8mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-8mm', nameKey: 'cutting' },
  acrylic_10mm_cutting: { materialId: 'acrylic', variantId: 'acrylic-10mm', nameKey: 'cutting' },
  acrylic_engraving: { materialId: 'acrylic', nameKey: 'engraving' },
  acrylic_printing: { materialId: 'acrylic', nameKey: 'printing' },
  black_acrylic_3mm_cutting: { materialId: 'black-acrylic', variantId: 'black-acrylic-3mm', nameKey: 'cutting' },
  black_acrylic_5mm_cutting: { materialId: 'black-acrylic', variantId: 'black-acrylic-5mm', nameKey: 'cutting' },
  black_acrylic_engraving: { materialId: 'black-acrylic', nameKey: 'engraving' },
  opaque_acrylic: { materialId: 'opaque-acrylic', nameKey: 'marking' },
  acrylic_fluorescent_3mm_cutting: {
    materialId: 'fluorescent-acrylic',
    variantId: 'fluorescent-acrylic-3mm',
    nameKey: 'cutting',
  },
  acrylic_fluorescent_5mm_cutting: {
    materialId: 'fluorescent-acrylic',
    variantId: 'fluorescent-acrylic-5mm',
    nameKey: 'cutting',
  },
  acrylic_fluorescent_engraving: { materialId: 'fluorescent-acrylic', nameKey: 'engraving' },
  acrylic_glitter_3mm_cutting: { materialId: 'glitter-acrylic', variantId: 'glitter-acrylic-3mm', nameKey: 'cutting' },
  acrylic_glitter_5mm_cutting: { materialId: 'glitter-acrylic', variantId: 'glitter-acrylic-5mm', nameKey: 'cutting' },
  acrylic_glitter_engraving: { materialId: 'glitter-acrylic', nameKey: 'engraving' },
  acrylic_sublimation_3mm_cutting: {
    materialId: 'sublimation-acrylic',
    variantId: 'sublimation-acrylic-3mm',
    nameKey: 'cutting',
  },
  acrylic_sublimation_5mm_cutting: {
    materialId: 'sublimation-acrylic',
    variantId: 'sublimation-acrylic-5mm',
    nameKey: 'cutting',
  },
  acrylic_sublimation_engraving: { materialId: 'sublimation-acrylic', nameKey: 'engraving' },
  acrylic_mixed_3mm_cutting: { materialId: 'mixed-acrylic', variantId: 'mixed-acrylic-3mm', nameKey: 'cutting' },
  acrylic_mixed_5mm_cutting: { materialId: 'mixed-acrylic', variantId: 'mixed-acrylic-5mm', nameKey: 'cutting' },
  acrylic_mixed_engraving: { materialId: 'mixed-acrylic', nameKey: 'engraving' },
  acrylic_film_3mm_cutting: { materialId: 'acrylic-with-film', variantId: 'acrylic-with-film-3mm', nameKey: 'cutting' },
  acrylic_film_5mm_cutting: { materialId: 'acrylic-with-film', variantId: 'acrylic-with-film-5mm', nameKey: 'cutting' },
  acrylic_film_engraving: { materialId: 'acrylic-with-film', nameKey: 'engraving' },
  // Leather
  leather_3mm_cutting: { materialId: 'leather', variantId: 'leather-3mm', nameKey: 'cutting' },
  leather_5mm_cutting: { materialId: 'leather', variantId: 'leather-5mm', nameKey: 'cutting' },
  leather_engraving: { materialId: 'leather', nameKey: 'engraving' },
  leather_printing: { materialId: 'leather', nameKey: 'printing' },
  gloss_leather_printing: { materialId: 'gloss-leather', nameKey: 'printing' },
  leather_faux_3mm_cutting: { materialId: 'faux-leather', variantId: 'faux-leather-3mm', nameKey: 'cutting' },
  leather_faux_engraving: { materialId: 'faux-leather', nameKey: 'engraving' },
  // Fabric-like
  fabric_3mm_cutting: { materialId: 'fabric', variantId: 'fabric-3mm', nameKey: 'cutting' },
  fabric_5mm_cutting: { materialId: 'fabric', variantId: 'fabric-5mm', nameKey: 'cutting' },
  fabric_engraving: { materialId: 'fabric', nameKey: 'engraving' },
  fabric_printing: { materialId: 'fabric', nameKey: 'printing' },
  denim_1mm_cutting: { materialId: 'denim', variantId: 'denim-1mm', nameKey: 'cutting' },
  canvas_printing: { materialId: 'canvas', nameKey: 'printing' },
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
