import type { ILang } from '@core/interfaces/ILang';

type Dropdown = ILang['beambox']['right_panel']['laser_panel']['dropdown'];

export interface PresetName {
  material: keyof Dropdown['materials'];
  preset?: keyof Dropdown['presets'];
  thicknessMm?: number;
}

/** Curated inch labels for the thicknesses presets.ts uses (marketing fractions, not conversions). */
export const inchLabels: Record<number, string> = {
  1: '1/32″',
  2: '1/16″',
  3: '1/8″',
  5: '3/16″',
  7: '9/32″',
  8: '5/16″',
  10: '3/8″',
};

const cut = (material: PresetName['material'], thicknessMm: number): PresetName => ({
  material,
  preset: 'cutting',
  thicknessMm,
});

/** Display name parts for every presets.ts key: `<material> - <thickness> <preset>`. */
/* eslint-disable perfectionist/sort-objects */
export const presetNames: Record<string, PresetName> = {
  wood_3mm_cutting: cut('wood', 3),
  wood_5mm_cutting: cut('wood', 5),
  wood_7mm_cutting: cut('wood', 7),
  wood_8mm_cutting: cut('wood', 8),
  wood_10mm_cutting: cut('wood', 10),
  wood_engraving: { material: 'wood', preset: 'engraving' },
  wood_plywood_3mm_cutting: cut('wood_plywood', 3),
  wood_plywood_5mm_cutting: cut('wood_plywood', 5),
  wood_plywood_engraving: { material: 'wood_plywood', preset: 'engraving' },
  wood_solid_3mm_cutting: cut('wood_solid', 3),
  wood_solid_5mm_cutting: cut('wood_solid', 5),
  wood_solid_engraving: { material: 'wood_solid', preset: 'engraving' },
  acrylic_3mm_cutting: cut('acrylic', 3),
  acrylic_5mm_cutting: cut('acrylic', 5),
  acrylic_7mm_cutting: cut('acrylic', 7),
  acrylic_8mm_cutting: cut('acrylic', 8),
  acrylic_10mm_cutting: cut('acrylic', 10),
  acrylic_engraving: { material: 'acrylic', preset: 'engraving' },
  acrylic_film_3mm_cutting: cut('acrylic_film', 3),
  acrylic_film_5mm_cutting: cut('acrylic_film', 5),
  acrylic_film_engraving: { material: 'acrylic_film', preset: 'engraving' },
  black_acrylic_3mm_cutting: cut('black_acrylic', 3),
  black_acrylic_5mm_cutting: cut('black_acrylic', 5),
  black_acrylic_engraving: { material: 'opaque_acrylic', preset: 'engraving' },
  mdf_3mm_cutting: cut('mdf', 3),
  mdf_5mm_cutting: cut('mdf', 5),
  mdf_7mm_cutting: cut('mdf', 7),
  mdf_engraving: { material: 'mdf', preset: 'engraving' },
  bamboo_2mm_cutting: cut('bamboo', 2),
  bamboo_5mm_cutting: cut('bamboo', 5),
  leather_3mm_cutting: cut('leather', 3),
  leather_5mm_cutting: cut('leather', 5),
  leather_engraving: { material: 'leather', preset: 'engraving' },
  denim_1mm_cutting: cut('denim', 1),
  fabric_3mm_cutting: cut('fabric', 3),
  fabric_5mm_cutting: cut('fabric', 5),
  fabric_engraving: { material: 'fabric', preset: 'engraving' },
  slate_engraving: { material: 'slate', preset: 'engraving' },
  rubber_bw_engraving: { material: 'rubber', preset: 'engraving' },
  glass_bw_engraving: { material: 'glass', preset: 'engraving' },
  steel_engraving_spray_engraving: { material: 'metal', preset: 'engraving' },
  stainless_steel_bw_engraving_diode: { material: 'metal', preset: 'engraving_diode' },
  metal_bw_engraving: { material: 'metal', preset: 'engraving' },
  sticker_kiss_cut: { material: 'sticker', preset: 'kiss_cut' },
  // 1064
  gold_engraving: { material: 'gold', preset: 'engraving' },
  brass_engraving: { material: 'brass', preset: 'engraving' },
  ti_engraving: { material: 'titanium', preset: 'engraving' },
  stainless_steel_engraving: { material: 'stainless_steel', preset: 'engraving' },
  aluminum_engraving: { material: 'aluminum', preset: 'engraving' },
  silver_engraving: { material: 'silver', preset: 'engraving' },
  iron_engraving: { material: 'iron', preset: 'engraving' },
  // promark
  metal_engraving: { material: 'metal', preset: 'marking' },
  aluminum_light: { material: 'aluminum', preset: 'marking_light' },
  stainless_steel_light: { material: 'stainless_steel', preset: 'marking_light' },
  stainless_steel_dark: { material: 'stainless_steel', preset: 'marking_dark' },
  brass_light: { material: 'brass', preset: 'marking_light' },
  brass_dark: { material: 'brass', preset: 'marking_dark' },
  copper: { material: 'copper', preset: 'marking' },
  titanium_light: { material: 'titanium', preset: 'marking_light' },
  titanium_dark: { material: 'titanium', preset: 'marking_dark' },
  white_abs: { material: 'white_abs', preset: 'marking' },
  black_abs: { material: 'black_abs', preset: 'marking' },
  opaque_acrylic: { material: 'opaque_acrylic', preset: 'marking' },
  stone: { material: 'stone', preset: 'marking' },
  // printing
  wood_printing: { material: 'wood', preset: 'printing' },
  mdf_printing: { material: 'mdf', preset: 'printing' },
  sticker_printing: { material: 'sticker', preset: 'printing' },
  cardstock_printing: { material: 'cardstock', preset: 'printing' },
  cardboard_printing: { material: 'cardboard', preset: 'printing' },
  bamboo_printing: { material: 'bamboo', preset: 'printing' },
  canvas_fabric_printing: { material: 'canvas_fabric', preset: 'printing' },
  canvas_printing: { material: 'canvas', preset: 'printing' },
  leather_printing: { material: 'leather', preset: 'printing' },
  fabric_printing: { material: 'fabric', preset: 'printing' },
  glass_printing: { material: 'glass', preset: 'printing' },
  cork_printing: { material: 'cork', preset: 'printing' },
  flat_stone_printing: { material: 'flat_stone', preset: 'printing' },
  acrylic_printing: { material: 'acrylic', preset: 'printing' },
  pc_printing: { material: 'pc', preset: 'printing' },
  stainless_steel_printing: { material: 'stainless_steel', preset: 'printing' },
  gloss_leather_printing: { material: 'gloss_leather', preset: 'printing' },
};
/* eslint-enable perfectionist/sort-objects */
