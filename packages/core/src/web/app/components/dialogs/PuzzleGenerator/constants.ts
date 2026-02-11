/**
 * Centralized constants for the PuzzleGenerator feature.
 * Organized by domain for discoverability.
 */

import type { TabJitter } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// COLORS - View mode color sets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical color sets for each view mode.
 * Used by the Konva preview (components/Preview) and the SVG export (geometry/svgExport).
 */
export const COLORS = {
  design: {
    boardBase: '#333333',
    fill: 'transparent',
    guideLines: '#333333',
    pieces: '#333333',
    raisedEdges: '#333333',
  },
  exploded: {
    boardBase: '#8bc34a',
    fill: 'transparent',
    guideLines: '#ffc107',
    pieces: '#f44336',
    raisedEdges: '#3f51b5',
  },
} as const;

export type ViewMode = keyof typeof COLORS;
export type ColorSet = (typeof COLORS)[ViewMode];

// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRY - Shape and layout constants
// ─────────────────────────────────────────────────────────────────────────────

/** Gap between puzzle and board in exploded view (mm) */
export const LAYER_GAP = 30;

/** Default sharpness for heart shape bottom point (0-50 scale) */
export const DEFAULT_HEART_SHARPNESS = 25;

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY - Piece merging algorithm thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Threshold for very small corner pieces requiring diagonal bridging (< 25%) */
export const VISIBILITY_VERY_SMALL = 0.25;

/** Default threshold for merging small pieces with neighbors (< 50%) */
export const VISIBILITY_MERGE_THRESHOLD = 0.5;

/** Target combined visibility for merged groups during expansion (>= 80%) */
export const VISIBILITY_GROUP_TARGET = 0.8;

// ─────────────────────────────────────────────────────────────────────────────
// JIGSAW - Tab generation and jitter constants
// ─────────────────────────────────────────────────────────────────────────────

/** Multiplier for tab depth relative to tab size */
export const TAB_DEPTH_MULTIPLIER = 3.0;

/** Default jitter coefficient for natural-looking tabs */
export const DEFAULT_JITTER = 0.04;

/** Default tab jitter with no offsets */
export const DEFAULT_TAB_JITTER: TabJitter = {
  depthOffset: 0,
  entryOffset: 0,
  exitOffset: 0,
  flip: true,
  neckOffset: 0,
  shoulderOffset: 0,
};

/** Seed values for deterministic random generation per orientation */
export const ORIENTATION_SEEDS: Record<1 | 2 | 3 | 4, number> = {
  1: 1337,
  2: 4242,
  3: 7890,
  4: 2468,
};

/** Cardinal direction offsets for neighbor traversal */
export const CARDINAL_DIRECTIONS = [
  { c: 1, r: 0 },
  { c: -1, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: -1 },
] as const;

/** Diagonal direction offsets for corner bridging */
export const DIAGONAL_DIRECTIONS = [
  { dc: 1, dr: 1 },
  { dc: -1, dr: 1 },
  { dc: 1, dr: -1 },
  { dc: -1, dr: -1 },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW - UI sizing and display constants
// ─────────────────────────────────────────────────────────────────────────────

/** Padding around the stage area */
export const STAGE_PADDING = 40;

/** Default stroke width for puzzle paths */
export const STROKE_WIDTH = 0.5;

/** Stroke width for guide lines (thinner than main paths) */
export const GUIDE_STROKE_WIDTH = 0.3;

/** Thumbnail button size in pixels */
export const THUMB_SIZE = 80;

/** Padding inside thumbnail buttons */
export const THUMB_PAD = 8;

/** Bottom offset for overlay positioning */
export const OVERLAY_BOTTOM = THUMB_SIZE + 24;

/** Millimeters per inch for unit conversion */
export const MM_PER_INCH = 25.4;
