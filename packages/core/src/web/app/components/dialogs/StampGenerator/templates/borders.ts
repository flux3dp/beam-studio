// Design-team decorative borders, one folder per family (`BorderShape`). The rect set (長方形邊匡12種) is
// authored in a 188×72 viewBox = the 47×18 mm engine box; builders/sliceBorder.ts nine-slices each one by
// `slice` (native px): corners keep their physical size, edges stretch along their axis or tile whole
// repeats, the center stretches. The square (100×100 = 25 mm), circle (120×120 = 30 mm) and oval
// (180×120 = 45×30 mm) sets have no `slice`: their boxes always have the drawn aspect ratio (ovals near
// it), so buildBorder scales the ink onto the box as drawn and ornaments shrink with the stamp.
// Skipped from design's folders: the "adjustable" stroke variants (可調式波浪 / 可調整虛線, a different
// feature: a wavy or dashed line at the user's width) and the Illustrator working files.
// The hand-drawn waves aren't periodic, so their corner cut and period were searched for a peak/trough
// where the band profile one period on matches the profile at the cut (a zero-slope cut also meets the
// mirrored far corner without a kink); the one repeat between is then tiled. All cut positions are in
// the ink-centered frame sliceStyle works in, not the raw viewBox.
import type { BorderShape } from '../types';

import CIRCLE_BOTANICAL_1 from './borders/circle/botanical_1.svg?raw';
import CIRCLE_BOTANICAL_2 from './borders/circle/botanical_2.svg?raw';
import CIRCLE_CONCENTRIC from './borders/circle/concentric.svg?raw';
import CIRCLE_RADIAL_CONCENTRIC from './borders/circle/radial_concentric.svg?raw';
import CIRCLE_RADIAL_DOTS from './borders/circle/radial_dots.svg?raw';
import CIRCLE_RADIAL_STARS from './borders/circle/radial_stars.svg?raw';
import CIRCLE_VINTAGE_1 from './borders/circle/vintage_1.svg?raw';
import CIRCLE_VINTAGE_2 from './borders/circle/vintage_2.svg?raw';
import CIRCLE_VINTAGE_3 from './borders/circle/vintage_3.svg?raw';
import CIRCLE_WREATH from './borders/circle/wreath.svg?raw';
import CIRCLE_WREATH_1 from './borders/circle/wreath_1.svg?raw';
import CIRCLE_WREATH_2 from './borders/circle/wreath_2.svg?raw';
import OVAL_BUBBLES from './borders/oval/bubbles.svg?raw';
import OVAL_FLORAL_1 from './borders/oval/floral_1.svg?raw';
import OVAL_FLORAL_2 from './borders/oval/floral_2.svg?raw';
import OVAL_GEOMETRIC from './borders/oval/geometric.svg?raw';
import OVAL_POSTAGE from './borders/oval/postage.svg?raw';
import OVAL_RADIAL from './borders/oval/radial.svg?raw';
import OVAL_VINTAGE_1 from './borders/oval/vintage_1.svg?raw';
import OVAL_VINTAGE_2 from './borders/oval/vintage_2.svg?raw';
import OVAL_VINTAGE_3 from './borders/oval/vintage_3.svg?raw';
import OVAL_WAVE from './borders/oval/wave.svg?raw';
import BRACKET_CORNERS from './borders/rect/bracket_corners.svg?raw';
import DECO_CORNERS from './borders/rect/deco_corners.svg?raw';
import DOUBLE_1 from './borders/rect/double_1.svg?raw';
import DOUBLE_2 from './borders/rect/double_2.svg?raw';
import FLORAL from './borders/rect/floral.svg?raw';
import NOTCH_DOUBLE from './borders/rect/notch_double.svg?raw';
import POSTAGE from './borders/rect/postage.svg?raw';
import SQUARE_CORNERS from './borders/rect/square_corners.svg?raw';
import STARS from './borders/rect/stars.svg?raw';
import WAVE from './borders/rect/wave.svg?raw';
import WAVE_BAND from './borders/rect/wave_band.svg?raw';
import SQUARE_CONCENTRIC from './borders/square/concentric.svg?raw';
import SQUARE_FLORAL_1 from './borders/square/floral_1.svg?raw';
import SQUARE_FLORAL_2 from './borders/square/floral_2.svg?raw';
import SQUARE_FLORAL_3 from './borders/square/floral_3.svg?raw';
import SQUARE_LINES_1 from './borders/square/lines_1.svg?raw';
import SQUARE_LINES_2 from './borders/square/lines_2.svg?raw';
import SQUARE_LINES_3 from './borders/square/lines_3.svg?raw';
import SQUARE_POSTAGE from './borders/square/postage.svg?raw';
import SQUARE_VINTAGE_1 from './borders/square/vintage_1.svg?raw';
import SQUARE_VINTAGE_2 from './borders/square/vintage_2.svg?raw';
import SQUARE_VINTAGE_3 from './borders/square/vintage_3.svg?raw';
export interface SliceDef {
  /** Corner cell size [cx, cy]; must cover the corner ornament and the band's thickness. */
  corner: [number, number];
  /** Repeat length of the top/bottom (h) and left/right (v) edges; an edge without one is stretched. */
  tile?: { h?: number; v?: number };
}

export interface BorderStyle {
  key: string;
  /** Nine-slice config; a style without one is scaled onto the box as drawn. */
  slice?: SliceDef;
  svg: string;
}

const RECT_BORDER_STYLES: BorderStyle[] = [
  { key: 'notch_double', slice: { corner: [12, 12] }, svg: NOTCH_DOUBLE },
  { key: 'deco_corners', slice: { corner: [30, 29] }, svg: DECO_CORNERS },
  { key: 'square_corners', slice: { corner: [11, 11] }, svg: SQUARE_CORNERS },
  { key: 'bracket_corners', slice: { corner: [17, 17] }, svg: BRACKET_CORNERS },
  { key: 'stars', slice: { corner: [12.52, 10.15], tile: { h: 11.647, v: 10.333 } }, svg: STARS },
  { key: 'wave', slice: { corner: [27.45, 17.4], tile: { h: 8.42, v: 10.05 } }, svg: WAVE },
  {
    key: 'wave_band',
    slice: { corner: [19.1, 18.3], tile: { h: 11.46, v: 11.56 } },
    svg: WAVE_BAND,
  },
  { key: 'floral', slice: { corner: [34, 33.5] }, svg: FLORAL },
  { key: 'postage', slice: { corner: [9.725, 10.35], tile: { h: 5.631, v: 5.631 } }, svg: POSTAGE },
  { key: 'double_1', slice: { corner: [20, 12] }, svg: DOUBLE_1 },
  { key: 'double_2', slice: { corner: [24, 24] }, svg: DOUBLE_2 },
];

const SQUARE_BORDER_STYLES: BorderStyle[] = [
  { key: 'concentric', svg: SQUARE_CONCENTRIC },
  { key: 'floral_1', svg: SQUARE_FLORAL_1 },
  { key: 'floral_2', svg: SQUARE_FLORAL_2 },
  { key: 'floral_3', svg: SQUARE_FLORAL_3 },
  { key: 'lines_1', svg: SQUARE_LINES_1 },
  { key: 'lines_2', svg: SQUARE_LINES_2 },
  { key: 'lines_3', svg: SQUARE_LINES_3 },
  { key: 'postage', svg: SQUARE_POSTAGE },
  { key: 'vintage_1', svg: SQUARE_VINTAGE_1 },
  { key: 'vintage_2', svg: SQUARE_VINTAGE_2 },
  { key: 'vintage_3', svg: SQUARE_VINTAGE_3 },
];

const CIRCLE_BORDER_STYLES: BorderStyle[] = [
  { key: 'botanical_1', svg: CIRCLE_BOTANICAL_1 },
  { key: 'botanical_2', svg: CIRCLE_BOTANICAL_2 },
  { key: 'concentric', svg: CIRCLE_CONCENTRIC },
  { key: 'radial_concentric', svg: CIRCLE_RADIAL_CONCENTRIC },
  { key: 'radial_dots', svg: CIRCLE_RADIAL_DOTS },
  { key: 'radial_stars', svg: CIRCLE_RADIAL_STARS },
  { key: 'vintage_1', svg: CIRCLE_VINTAGE_1 },
  { key: 'vintage_2', svg: CIRCLE_VINTAGE_2 },
  { key: 'vintage_3', svg: CIRCLE_VINTAGE_3 },
  { key: 'wreath', svg: CIRCLE_WREATH },
  { key: 'wreath_1', svg: CIRCLE_WREATH_1 },
  { key: 'wreath_2', svg: CIRCLE_WREATH_2 },
];

const OVAL_BORDER_STYLES: BorderStyle[] = [
  { key: 'bubbles', svg: OVAL_BUBBLES },
  { key: 'floral_1', svg: OVAL_FLORAL_1 },
  { key: 'floral_2', svg: OVAL_FLORAL_2 },
  { key: 'geometric', svg: OVAL_GEOMETRIC },
  { key: 'postage', svg: OVAL_POSTAGE },
  { key: 'radial', svg: OVAL_RADIAL },
  { key: 'vintage_1', svg: OVAL_VINTAGE_1 },
  { key: 'vintage_2', svg: OVAL_VINTAGE_2 },
  { key: 'vintage_3', svg: OVAL_VINTAGE_3 },
  { key: 'wave', svg: OVAL_WAVE },
];

/** Selectable in the Border tab after the plain stroke line, per `BorderDef.shape`. */
export const BORDER_STYLES: Record<BorderShape, BorderStyle[]> = {
  circle: CIRCLE_BORDER_STYLES,
  oval: OVAL_BORDER_STYLES,
  rect: RECT_BORDER_STYLES,
  square: SQUARE_BORDER_STYLES,
};
