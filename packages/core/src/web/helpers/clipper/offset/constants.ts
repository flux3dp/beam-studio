export type OffsetMode =
  | 'inwardFilled' // GAP in single object THINNER (material expands)
  | 'inwardOutline' // Material shrinks
  | 'outwardFilled' // GAP in single object THICKER (material shrinks)
  | 'outwardOutline'; // Material expands

export const SCALE_FACTOR = 100; // Scale factor for ClipperLib operations, to handle precision issues
export const ROUND_FACTOR = 100; // Used for rounding points in fitPath
export const UNSUPPORTED_TAGS = ['g', 'image', 'text', 'use'] as const; // Tags that are not supported for offset operations
export const MITER_LIMIT = 1; // Miter limit for ClipperOffset
export const ARC_TOLERANCE = 0.25; // Arc tolerance for ClipperOffset
