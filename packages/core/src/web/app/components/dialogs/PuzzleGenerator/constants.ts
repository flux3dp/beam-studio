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

/** When true, the heart shape is vertically stretched so lobe peaks and bottom point touch grid edges. */
export const HEART_FIT_TO_GRID = true;

/**
 * The heart's actual visual height as a fraction of its nominal bounding box height.
 * Lobe peaks are at centerY - 0.425h (not -0.5h) because the Bezier control points
 * at topY are handles, not through-points. The curve reaches 75% of the way from
 * notchY to topY: notchY - 0.75 * topCurveHeight = -0.2h - 0.225h = -0.425h.
 * Visual span = 0.425h + 0.5h = 0.925h. Constant — independent of cornerRadius.
 */
export const HEART_VISUAL_HEIGHT_RATIO = 0.925;

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY - Piece merging algorithm thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Default threshold for merging small pieces with neighbors (< 40%) */
export const VISIBILITY_MERGE_THRESHOLD = 0.4;

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

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW - UI sizing and display constants
// ─────────────────────────────────────────────────────────────────────────────

/** Padding around the stage area */
export const STAGE_PADDING = 40;

/** Target stroke width in screen pixels — divided by scale to get puzzle-space width */
export const STROKE_PX = 1.5;

/** Guide lines are thinner than main strokes (ratio relative to STROKE_PX) */
export const GUIDE_STROKE_RATIO = 0.6;

/** Thumbnail button size in pixels */
export const THUMB_SIZE = 80;

/** Padding inside thumbnail buttons */
export const THUMB_PAD = 8;

/** Bottom offset for overlay positioning */
export const OVERLAY_BOTTOM = THUMB_SIZE + 24;

/** Millimeters per inch for unit conversion */
export const MM_PER_INCH = 25.4;
