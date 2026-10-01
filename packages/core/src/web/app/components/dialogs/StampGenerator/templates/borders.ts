// Design-team decorative borders, one folder per family (`BorderShape`). The rect set (長方形邊匡12種) is
// authored in a 188×72 viewBox = the 47×18 mm engine box; builders/sliceBorder.ts nine-slices each one by
// `slice` (native px): corners keep their physical size, edges stretch along their axis or tile whole
// repeats, the center stretches. Round/oval families will plug in as more keys of BORDER_STYLES.
// The hand-drawn waves aren't periodic, so their corner cut and period were searched for a peak/trough
// where the band profile one period on matches the profile at the cut (a zero-slope cut also meets the
// mirrored far corner without a kink); the one repeat between is then tiled. All cut positions are in
// the ink-centered frame sliceStyle works in, not the raw viewBox.
import type { BorderShape } from '../types';

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

export interface SliceDef {
  /** Corner cell size [cx, cy]; must cover the corner ornament and the band's thickness. */
  corner: [number, number];
  /** Repeat length of the top/bottom (h) and left/right (v) edges; an edge without one is stretched. */
  tile?: { h?: number; v?: number };
}

export interface BorderStyle {
  key: string;
  slice: SliceDef;
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

/** Selectable in the Border tab after the plain stroke line, per `BorderDef.shape`. */
export const BORDER_STYLES: Record<BorderShape, BorderStyle[]> = { rect: RECT_BORDER_STYLES };
