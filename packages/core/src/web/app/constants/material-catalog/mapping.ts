import type { MaterialCategory } from '@core/interfaces/IMaterial';

/**
 * Hand-authored curation layer that groups the flat presets.ts keys into Materials
 * (PRD §9). Parameter values are NOT duplicated here — getBundledCatalog() pulls them
 * from presets.ts at build time, so the two can never drift.
 */

export interface BundledMaterialDef {
  category: MaterialCategory;
  id: string;
  /** i18n key under beambox.material_browser.catalog.materials.* */
  nameKey: string;
  /** Variant of another material: hidden from the grid, shown in the parent's thickness switcher */
  parentId?: string;
  tags?: string[];
  /** Honest decimal conversion; display rounds to the nearest standard fraction */
  thicknessInch?: number;
  thicknessMm?: number;
}

export interface PresetMapping {
  /** Target material (or variant) id from materialDefs */
  materialId: string;
  /** i18n key under beambox.material_browser.catalog.presets.* */
  nameKey: string;
}

/* eslint-disable perfectionist/sort-objects */
export const materialDefs: BundledMaterialDef[] = [
  // Wood
  { id: 'wood', nameKey: 'wood', category: 'wood' },
  { id: 'wood-3mm', nameKey: 'wood', category: 'wood', parentId: 'wood', thicknessMm: 3, thicknessInch: 0.1181 },
  { id: 'wood-5mm', nameKey: 'wood', category: 'wood', parentId: 'wood', thicknessMm: 5, thicknessInch: 0.1969 },
  { id: 'wood-7mm', nameKey: 'wood', category: 'wood', parentId: 'wood', thicknessMm: 7, thicknessInch: 0.2756 },
  { id: 'wood-8mm', nameKey: 'wood', category: 'wood', parentId: 'wood', thicknessMm: 8, thicknessInch: 0.315 },
  { id: 'wood-10mm', nameKey: 'wood', category: 'wood', parentId: 'wood', thicknessMm: 10, thicknessInch: 0.3937 },
  { id: 'mdf', nameKey: 'mdf', category: 'wood' },
  { id: 'mdf-3mm', nameKey: 'mdf', category: 'wood', parentId: 'mdf', thicknessMm: 3, thicknessInch: 0.1181 },
  { id: 'mdf-5mm', nameKey: 'mdf', category: 'wood', parentId: 'mdf', thicknessMm: 5, thicknessInch: 0.1969 },
  { id: 'mdf-7mm', nameKey: 'mdf', category: 'wood', parentId: 'mdf', thicknessMm: 7, thicknessInch: 0.2756 },
  { id: 'bamboo', nameKey: 'bamboo', category: 'wood' },
  { id: 'bamboo-2mm', nameKey: 'bamboo', category: 'wood', parentId: 'bamboo', thicknessMm: 2, thicknessInch: 0.0787 },
  { id: 'bamboo-5mm', nameKey: 'bamboo', category: 'wood', parentId: 'bamboo', thicknessMm: 5, thicknessInch: 0.1969 },
  { id: 'cork', nameKey: 'cork', category: 'wood' },
  // Acrylic
  { id: 'acrylic', nameKey: 'acrylic', category: 'acrylic' },
  {
    id: 'acrylic-3mm',
    nameKey: 'acrylic',
    category: 'acrylic',
    parentId: 'acrylic',
    thicknessMm: 3,
    thicknessInch: 0.1181,
  },
  {
    id: 'acrylic-5mm',
    nameKey: 'acrylic',
    category: 'acrylic',
    parentId: 'acrylic',
    thicknessMm: 5,
    thicknessInch: 0.1969,
  },
  {
    id: 'acrylic-7mm',
    nameKey: 'acrylic',
    category: 'acrylic',
    parentId: 'acrylic',
    thicknessMm: 7,
    thicknessInch: 0.2756,
  },
  {
    id: 'acrylic-8mm',
    nameKey: 'acrylic',
    category: 'acrylic',
    parentId: 'acrylic',
    thicknessMm: 8,
    thicknessInch: 0.315,
  },
  {
    id: 'acrylic-10mm',
    nameKey: 'acrylic',
    category: 'acrylic',
    parentId: 'acrylic',
    thicknessMm: 10,
    thicknessInch: 0.3937,
  },
  { id: 'black-acrylic', nameKey: 'black_acrylic', category: 'acrylic' },
  {
    id: 'black-acrylic-3mm',
    nameKey: 'black_acrylic',
    category: 'acrylic',
    parentId: 'black-acrylic',
    thicknessMm: 3,
    thicknessInch: 0.1181,
  },
  {
    id: 'black-acrylic-5mm',
    nameKey: 'black_acrylic',
    category: 'acrylic',
    parentId: 'black-acrylic',
    thicknessMm: 5,
    thicknessInch: 0.1969,
  },
  { id: 'opaque-acrylic', nameKey: 'opaque_acrylic', category: 'acrylic' },
  // Leather
  { id: 'leather', nameKey: 'leather', category: 'leather' },
  {
    id: 'leather-3mm',
    nameKey: 'leather',
    category: 'leather',
    parentId: 'leather',
    thicknessMm: 3,
    thicknessInch: 0.1181,
  },
  {
    id: 'leather-5mm',
    nameKey: 'leather',
    category: 'leather',
    parentId: 'leather',
    thicknessMm: 5,
    thicknessInch: 0.1969,
  },
  { id: 'gloss-leather', nameKey: 'gloss_leather', category: 'leather' },
  // Fabric-like (no dedicated category; PRD fixed set → other)
  { id: 'fabric', nameKey: 'fabric', category: 'other' },
  { id: 'fabric-3mm', nameKey: 'fabric', category: 'other', parentId: 'fabric', thicknessMm: 3, thicknessInch: 0.1181 },
  { id: 'fabric-5mm', nameKey: 'fabric', category: 'other', parentId: 'fabric', thicknessMm: 5, thicknessInch: 0.1969 },
  { id: 'denim', nameKey: 'denim', category: 'other', thicknessMm: 1, thicknessInch: 0.0394 },
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
  wood_3mm_cutting: { materialId: 'wood-3mm', nameKey: 'cutting' },
  wood_5mm_cutting: { materialId: 'wood-5mm', nameKey: 'cutting' },
  wood_7mm_cutting: { materialId: 'wood-7mm', nameKey: 'cutting' },
  wood_8mm_cutting: { materialId: 'wood-8mm', nameKey: 'cutting' },
  wood_10mm_cutting: { materialId: 'wood-10mm', nameKey: 'cutting' },
  wood_engraving: { materialId: 'wood', nameKey: 'engraving' },
  wood_printing: { materialId: 'wood', nameKey: 'printing' },
  mdf_3mm_cutting: { materialId: 'mdf-3mm', nameKey: 'cutting' },
  mdf_5mm_cutting: { materialId: 'mdf-5mm', nameKey: 'cutting' },
  mdf_7mm_cutting: { materialId: 'mdf-7mm', nameKey: 'cutting' },
  mdf_engraving: { materialId: 'mdf', nameKey: 'engraving' },
  mdf_printing: { materialId: 'mdf', nameKey: 'printing' },
  bamboo_2mm_cutting: { materialId: 'bamboo-2mm', nameKey: 'cutting' },
  bamboo_5mm_cutting: { materialId: 'bamboo-5mm', nameKey: 'cutting' },
  bamboo_printing: { materialId: 'bamboo', nameKey: 'printing' },
  cork_printing: { materialId: 'cork', nameKey: 'printing' },
  // Acrylic
  acrylic_3mm_cutting: { materialId: 'acrylic-3mm', nameKey: 'cutting' },
  acrylic_5mm_cutting: { materialId: 'acrylic-5mm', nameKey: 'cutting' },
  acrylic_7mm_cutting: { materialId: 'acrylic-7mm', nameKey: 'cutting' },
  acrylic_8mm_cutting: { materialId: 'acrylic-8mm', nameKey: 'cutting' },
  acrylic_10mm_cutting: { materialId: 'acrylic-10mm', nameKey: 'cutting' },
  acrylic_engraving: { materialId: 'acrylic', nameKey: 'engraving' },
  acrylic_printing: { materialId: 'acrylic', nameKey: 'printing' },
  black_acrylic_3mm_cutting: { materialId: 'black-acrylic-3mm', nameKey: 'cutting' },
  black_acrylic_5mm_cutting: { materialId: 'black-acrylic-5mm', nameKey: 'cutting' },
  black_acrylic_engraving: { materialId: 'black-acrylic', nameKey: 'engraving' },
  opaque_acrylic: { materialId: 'opaque-acrylic', nameKey: 'marking' },
  // Leather
  leather_3mm_cutting: { materialId: 'leather-3mm', nameKey: 'cutting' },
  leather_5mm_cutting: { materialId: 'leather-5mm', nameKey: 'cutting' },
  leather_engraving: { materialId: 'leather', nameKey: 'engraving' },
  leather_printing: { materialId: 'leather', nameKey: 'printing' },
  gloss_leather_printing: { materialId: 'gloss-leather', nameKey: 'printing' },
  // Fabric-like
  fabric_3mm_cutting: { materialId: 'fabric-3mm', nameKey: 'cutting' },
  fabric_5mm_cutting: { materialId: 'fabric-5mm', nameKey: 'cutting' },
  fabric_engraving: { materialId: 'fabric', nameKey: 'engraving' },
  fabric_printing: { materialId: 'fabric', nameKey: 'printing' },
  denim_1mm_cutting: { materialId: 'denim', nameKey: 'cutting' },
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
