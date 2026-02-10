export type CornerType = 'round' | 'sharp';

export type OffsetMode =
  | 'expand' // GAP in single object THICKER (material shrinks)
  | 'inward' // Material shrinks
  | 'outward' // Material expands
  | 'shrink'; // GAP in single object THINNER (material expands)

export const SCALE_FACTOR = 100; // Scale factor for ClipperLib operations, to handle precision issues
export const ROUND_FACTOR = 100; // Used for rounding points in fitPath
export const MITER_LIMIT = 5; // Miter limit for ClipperOffset
export const ARC_TOLERANCE = 0.25; // Arc tolerance for ClipperOffset

type Point = { X: number; Y: number };
export type Path = Point[];
