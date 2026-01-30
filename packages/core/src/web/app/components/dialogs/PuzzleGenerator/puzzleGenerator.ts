/**
 * Puzzle Generation Algorithm
 *
 * Edge-based jigsaw puzzle generator inspired by Draradech's algorithm.
 * Generates SVG paths for laser cutting with proper interlocking tabs.
 *
 * Key concepts:
 * - Edge-based: Generate all horizontal cuts, then all vertical cuts
 * - Deterministic: Same settings always produce same output
 * - Truncate-at-boundary: Non-rectangular shapes clip the rectangular grid
 */

import { match, P } from 'ts-pattern';

import type { PuzzleJitterMap, PuzzleState, TabJitter } from './types';

// ============================================================================
// Types
// ============================================================================

export interface PuzzleEdges {
  // The shape boundary path (circle, heart, rectangle outline)
  boundaryPath: string;
  // All horizontal edge cuts (between rows)
  horizontalEdges: string;
  // All vertical edge cuts (between columns)
  verticalEdges: string;
}

export interface PuzzlePiece {
  col: number;
  path: string; // SVG path data for preview
  row: number;
}

export interface PieceVisibility {
  col: number;
  row: number;
  visibleRatio: number; // 0-1, how much of the piece is inside the boundary
}

export interface MergeGroup {
  pieces: Array<{ col: number; row: number }>; // All pieces in this merge group
  sharedEdges: Array<{ col1: number; col2: number; row1: number; row2: number }>; // Edges to remove
}

// ============================================================================
// Tab Generation Constants
// ============================================================================

// Tab depth multiplier (relative to tabSize) - based on Draradech algorithm
const TAB_DEPTH_MULTIPLIER = 3.0;

// Default jitter amount (4% = 0.04) - controls how much tabs vary from each other
const DEFAULT_JITTER = 0.04;

// Each orientation type has a unique seed for distinct visual character
// These create reproducible but visually different puzzle patterns
const ORIENTATION_SEEDS: Record<1 | 2 | 3 | 4, number> = {
  1: 1337, // Classic pattern
  2: 4242, // Inverted pattern
  3: 7890, // Row-alternating pattern
  4: 2468, // Column-alternating pattern
};

// ============================================================================
// Seeded Random Number Generator (Draradech algorithm)
// ============================================================================

/**
 * Create a seeded pseudo-random number generator
 * Uses sine-based PRNG for deterministic, reproducible results
 * Same seed always produces the same sequence of random numbers
 */
const createSeededRandom = (seed: number): (() => number) => {
  let currentSeed = seed;

  return () => {
    const x = Math.sin(currentSeed) * 10000;

    currentSeed += 1;

    return x - Math.floor(x);
  };
};

/**
 * Generate a uniform random value in [min, max] range
 */
const uniform = (random: () => number, min: number, max: number): number => min + random() * (max - min);

/**
 * Generate a random boolean (Draradech's rbool)
 */
const rbool = (random: () => number): boolean => random() > 0.5;

// ============================================================================
// Jitter Map Generation
// ============================================================================

/**
 * Generate jitter coefficients for ALL edges in the puzzle (Draradech algorithm)
 *
 * This ensures:
 * - Reproducibility: Same orientation = same puzzle every time
 * - Continuity: Adjacent tabs share the 'a/e' coefficient for smooth flow
 * - Natural variety: Each tab has RANDOM flip direction + unique jitter
 *
 * Key insights from Draradech:
 * 1. Each tab's flip direction is RANDOM (not checkerboard pattern)
 * 2. Coefficient 'a' = previous 'e', BUT inverted if flip direction changed
 *    This creates smooth transitions between tabs regardless of direction
 */
export const generateJitterMap = (
  rows: number,
  cols: number,
  orientation: 1 | 2 | 3 | 4,
  jitter: number = DEFAULT_JITTER,
): PuzzleJitterMap => {
  const seed = ORIENTATION_SEEDS[orientation];
  const random = createSeededRandom(seed);
  const j = jitter;

  // Generate horizontal edges (rows-1 edges, each with cols segments)
  const horizontal: TabJitter[][] = [];

  for (let yi = 0; yi < rows - 1; yi++) {
    horizontal[yi] = [];

    // Initialize for first segment in this row
    let prevE = uniform(random, -j, j);
    let prevFlip = rbool(random);

    for (let xi = 0; xi < cols; xi++) {
      // Random flip direction for THIS tab - this is what creates variety!
      const flip = rbool(random);

      // Key Draradech insight: invert 'a' if flip direction changed
      // This ensures smooth curve transitions regardless of tab direction
      const a = flip === prevFlip ? prevE : -prevE;

      const jitterCoeffs: TabJitter = {
        a,
        b: uniform(random, -j, j),
        c: uniform(random, -j, j),
        d: uniform(random, -j, j),
        e: uniform(random, -j, j),
        flip,
      };

      horizontal[yi][xi] = jitterCoeffs;

      // Pass to next segment
      prevE = jitterCoeffs.e;
      prevFlip = flip;
    }
  }

  // Generate vertical edges (cols-1 edges, each with rows segments)
  const vertical: TabJitter[][] = [];

  for (let xi = 0; xi < cols - 1; xi++) {
    vertical[xi] = [];

    // Initialize for first segment in this column
    let prevE = uniform(random, -j, j);
    let prevFlip = rbool(random);

    for (let yi = 0; yi < rows; yi++) {
      const flip = rbool(random);
      const a = flip === prevFlip ? prevE : -prevE;

      const jitterCoeffs: TabJitter = {
        a,
        b: uniform(random, -j, j),
        c: uniform(random, -j, j),
        d: uniform(random, -j, j),
        e: uniform(random, -j, j),
        flip,
      };

      vertical[xi][yi] = jitterCoeffs;

      prevE = jitterCoeffs.e;
      prevFlip = flip;
    }
  }

  return { horizontal, vertical };
};

// ============================================================================
// Bezier Curve Tab Generation
// ============================================================================

/**
 * Default jitter coefficients (no variation - used for preview pieces)
 */
const DEFAULT_TAB_JITTER: TabJitter = { a: 0, b: 0, c: 0, d: 0, e: 0, flip: true };

/**
 * Generate a single tab edge using cubic Bezier curves with jitter
 * Based on Draradech's 10-point Bezier profile
 *
 * The jitter coefficients create natural variation in each tab:
 * - a: Start curve offset (inherited from previous tab's 'e')
 * - b: Horizontal shift of the entire knob
 * - c: Vertical shift of the entire knob
 * - d: Asymmetry factor (makes left/right sides different)
 * - e: End curve offset (passed to next tab as 'a')
 *
 * @param startX - Start X coordinate
 * @param startY - Start Y coordinate
 * @param endX - End X coordinate
 * @param endY - End Y coordinate
 * @param tabSize - Tab size as fraction (0-0.12)
 * @param flip - true = tab bulges in positive perpendicular direction
 * @param jitter - Jitter coefficients for natural variation
 */
const generateTabCurve = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tabSize: number,
  flip: boolean,
  jitter: TabJitter = DEFAULT_TAB_JITTER,
): string => {
  // Edge vector
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return '';

  // Unit vectors along edge (l) and perpendicular (w)
  const lx = dx / length;
  const ly = dy / length;
  // Perpendicular vector (rotated 90 degrees)
  const wx = -ly;
  const wy = lx;

  // Flip direction multiplier
  const flipMult = flip ? 1.0 : -1.0;

  // Tab size parameter (t in original algorithm)
  const t = tabSize;

  // Extract jitter coefficients
  const { a, b, c, d, e } = jitter;

  // Helper to compute point along edge with perpendicular offset
  const point = (alongEdge: number, perpOffset: number): { x: number; y: number } => ({
    x: startX + dx * alongEdge + wx * perpOffset * length * flipMult,
    y: startY + dy * alongEdge + wy * perpOffset * length * flipMult,
  });

  // Control points defining the tab profile with jitter applied
  // p0 is implicit start point at (0, 0)
  // Jitter offsets create unique, natural-looking tabs
  const p1 = point(0.2, a); // Entry influenced by previous tab
  const p2 = point(0.5 + b + d, -t + c); // Approach to knob
  const p3 = point(0.5 - t + b, t + c); // Knob left edge
  const p4 = point(0.5 - 2.0 * t + b - d, TAB_DEPTH_MULTIPLIER * t + c); // Knob left peak
  const p5 = point(0.5 + 2.0 * t + b - d, TAB_DEPTH_MULTIPLIER * t + c); // Knob right peak
  const p6 = point(0.5 + t + b, t + c); // Knob right edge
  const p7 = point(0.5 + b + d, -t + c); // Exit from knob
  const p8 = point(0.8, e); // Exit curve (influences next tab)
  const p9 = point(1.0, 0.0); // End point

  // Build the Bezier curve path
  // Three cubic Bezier segments: p0→p3, p3→p6, p6→p9
  return [
    `C ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `C ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} ${p5.x.toFixed(2)} ${p5.y.toFixed(2)} ${p6.x.toFixed(2)} ${p6.y.toFixed(2)}`,
    `C ${p7.x.toFixed(2)} ${p7.y.toFixed(2)} ${p8.x.toFixed(2)} ${p8.y.toFixed(2)} ${p9.x.toFixed(2)} ${p9.y.toFixed(2)}`,
  ].join(' ');
};

/**
 * Generate a straight edge (no tab)
 */
const generateStraightEdge = (endX: number, endY: number): string => `L ${endX.toFixed(2)} ${endY.toFixed(2)}`;

// ============================================================================
// Edge-Based Puzzle Generation
// ============================================================================

/**
 * Determine tab direction based on position (deterministic alternating pattern)
 * Uses orientation to vary the pattern
 */
const getTabFlip = (row: number, col: number, orientation: 1 | 2 | 3 | 4): boolean => {
  const base = (row + col) % 2 === 0;

  return match(orientation)
    .with(1, () => base)
    .with(2, () => !base)
    .with(3, () => (row % 2 === 0 ? base : !base))
    .with(4, () => (col % 2 === 0 ? base : !base))
    .exhaustive();
};

/**
 * Convert display tab size (0-30) to actual fraction (0-0.12)
 * User sees 0-30 scale, internally we use 0-12% (0-0.12 as fraction)
 */
const getTabSizeFraction = (displayValue: number): number => {
  // displayValue is 0-30, we want 0-12% as fraction (0-0.12)
  // 30 display = 12% = 0.12 fraction
  return (displayValue * 0.4) / 100;
};

/**
 * Generate all horizontal edge cuts (between rows)
 * These are the cuts that go left-to-right, separating row N from row N+1
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
const generateHorizontalEdges = (
  state: PuzzleState,
  offsetX: number,
  offsetY: number,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): string => {
  const { columns, orientation, pieceSize, rows, tabSize } = state;
  const t = getTabSizeFraction(tabSize); // Convert display value to fraction
  const paths: string[] = [];

  // Generate horizontal edges (yi = 1 to rows-1, excluding top and bottom boundaries)
  for (let yi = 1; yi < rows; yi++) {
    const y = offsetY + yi * pieceSize;
    let pathData = '';
    let currentSegmentStart: null | number = null;

    // Generate tab for each column segment
    for (let xi = 0; xi < columns; xi++) {
      // A horizontal edge at row yi separates piece (yi-1, xi) from piece (yi, xi)
      const isShared = isEdgeShared(yi - 1, xi, yi, xi, mergeGroups);

      if (isShared) {
        // End current segment if any
        if (currentSegmentStart !== null) {
          paths.push(pathData);
          pathData = '';
          currentSegmentStart = null;
        }

        continue;
      }

      const x1 = offsetX + xi * pieceSize;
      const x2 = offsetX + (xi + 1) * pieceSize;

      // Start new segment if needed
      if (currentSegmentStart === null) {
        pathData = `M ${x1.toFixed(2)} ${y.toFixed(2)}`;
        currentSegmentStart = x1;
      }

      // Get jitter for this specific edge (yi-1 because horizontal edges are 0-indexed)
      const jitter = jitterMap?.horizontal[yi - 1]?.[xi];
      // Use random flip from jitter if available, otherwise fall back to deterministic pattern
      const flip = jitter?.flip ?? getTabFlip(yi, xi, orientation);

      if (t > 0) {
        pathData += ' ' + generateTabCurve(x1, y, x2, y, t, flip, jitter);
      } else {
        pathData += ' ' + generateStraightEdge(x2, y);
      }
    }

    if (pathData) {
      paths.push(pathData);
    }
  }

  return paths.join(' ');
};

/**
 * Generate all vertical edge cuts (between columns)
 * These are the cuts that go top-to-bottom, separating column N from column N+1
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
const generateVerticalEdges = (
  state: PuzzleState,
  offsetX: number,
  offsetY: number,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): string => {
  const { columns, orientation, pieceSize, rows, tabSize } = state;
  const t = getTabSizeFraction(tabSize); // Convert display value to fraction
  const paths: string[] = [];

  // Generate vertical edges (xi = 1 to columns-1, excluding left and right boundaries)
  for (let xi = 1; xi < columns; xi++) {
    const x = offsetX + xi * pieceSize;
    let pathData = '';
    let currentSegmentStart: null | number = null;

    // Generate tab for each row segment
    for (let yi = 0; yi < rows; yi++) {
      // A vertical edge at column xi separates piece (yi, xi-1) from piece (yi, xi)
      const isShared = isEdgeShared(yi, xi - 1, yi, xi, mergeGroups);

      if (isShared) {
        // End current segment if any
        if (currentSegmentStart !== null) {
          paths.push(pathData);
          pathData = '';
          currentSegmentStart = null;
        }

        continue;
      }

      const y1 = offsetY + yi * pieceSize;
      const y2 = offsetY + (yi + 1) * pieceSize;

      // Start new segment if needed
      if (currentSegmentStart === null) {
        pathData = `M ${x.toFixed(2)} ${y1.toFixed(2)}`;
        currentSegmentStart = y1;
      }

      // Get jitter for this specific edge (xi-1 because vertical edges are 0-indexed)
      const jitter = jitterMap?.vertical[xi - 1]?.[yi];
      // Use random flip from jitter if available, otherwise fall back to deterministic pattern
      const flip = jitter?.flip ?? !getTabFlip(yi, xi, orientation); // Invert for vertical when using fallback

      if (t > 0) {
        pathData += ' ' + generateTabCurve(x, y1, x, y2, t, flip, jitter);
      } else {
        pathData += ' ' + generateStraightEdge(x, y2);
      }
    }

    if (pathData) {
      paths.push(pathData);
    }
  }

  return paths.join(' ');
};

/**
 * Generate rectangular boundary path
 */
const generateRectangleBoundary = (
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  cornerRadius: number = 0,
): string => {
  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius, width / 2, height / 2);

    return [
      `M ${(offsetX + r).toFixed(2)} ${offsetY.toFixed(2)}`,
      `L ${(offsetX + width - r).toFixed(2)} ${offsetY.toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(offsetX + width).toFixed(2)} ${(offsetY + r).toFixed(2)}`,
      `L ${(offsetX + width).toFixed(2)} ${(offsetY + height - r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(offsetX + width - r).toFixed(2)} ${(offsetY + height).toFixed(2)}`,
      `L ${(offsetX + r).toFixed(2)} ${(offsetY + height).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${offsetX.toFixed(2)} ${(offsetY + height - r).toFixed(2)}`,
      `L ${offsetX.toFixed(2)} ${(offsetY + r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(offsetX + r).toFixed(2)} ${offsetY.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${offsetX.toFixed(2)} ${offsetY.toFixed(2)}`,
    `L ${(offsetX + width).toFixed(2)} ${offsetY.toFixed(2)}`,
    `L ${(offsetX + width).toFixed(2)} ${(offsetY + height).toFixed(2)}`,
    `L ${offsetX.toFixed(2)} ${(offsetY + height).toFixed(2)}`,
    'Z',
  ].join(' ');
};

/**
 * Generate ellipse boundary path
 * Creates an ellipse that fits the full grid dimensions (width x height)
 */
const generateEllipseBoundary = (centerX: number, centerY: number, radiusX: number, radiusY: number): string => {
  // Ellipse using two arc commands
  return [
    `M ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX - radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

/**
 * Generate heart boundary path
 * Heart is centered at (centerX, centerY) and fits within width x height
 * Point faces downward (traditional heart orientation)
 * Bottom curves are more linear for a cleaner look
 */
const generateHeartBoundary = (centerX: number, centerY: number, width: number, height: number): string => {
  const topCurveHeight = height * 0.3;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Key y-positions (centered at centerY)
  const topY = centerY - halfHeight; // Very top of heart
  const notchY = topY + topCurveHeight; // Where the top curves meet (the notch)
  const bottomY = centerY + halfHeight; // Bottom point of heart

  // Control points for more linear bottom curves
  // First control point stays close to the side, second control point moves toward bottom center
  const bottomLeftCtrl1Y = bottomY * 0.4 + centerY * 0.6; // Closer to notchY level
  const bottomLeftCtrl2X = centerX - halfWidth * 0.3; // 30% from center toward left
  const bottomLeftCtrl2Y = bottomY * 0.8 + centerY * 0.2; // 80% toward bottom

  return [
    // Start at top center notch
    `M ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    // Top left curve (notch to left peak)
    `C ${centerX.toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    // Bottom left curve (more linear - control points create straighter line to bottom)
    `C ${(centerX - halfWidth).toFixed(2)} ${bottomLeftCtrl1Y.toFixed(2)} ${bottomLeftCtrl2X.toFixed(2)} ${bottomLeftCtrl2Y.toFixed(2)} ${centerX.toFixed(2)} ${bottomY.toFixed(2)}`,
    // Bottom right curve (mirror of left)
    `C ${(centerX + halfWidth * 0.3).toFixed(2)} ${bottomLeftCtrl2Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${bottomLeftCtrl1Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    // Top right curve (right peak to notch)
    `C ${(centerX + halfWidth).toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// ============================================================================
// Border Path Generation
// ============================================================================

/**
 * Generate border path for a given shape
 * Border is offset outward from the boundary by borderWidth
 * Centered at origin (0, 0)
 */
export const generateBorderPath = (
  gridGenerator: string,
  width: number,
  height: number,
  borderWidth: number,
  cornerRadius: number = 0,
): string =>
  match(gridGenerator)
    .with('circle', () => {
      // Ellipse border: expand radii by borderWidth
      const radiusX = width / 2 + borderWidth;
      const radiusY = height / 2 + borderWidth;

      return generateEllipseBoundary(0, 0, radiusX, radiusY);
    })
    .with('rectangle', () => {
      // Rectangle border: expand by borderWidth with optional corner radius
      const borderWidth2 = borderWidth * 2;
      const newWidth = width + borderWidth2;
      const newHeight = height + borderWidth2;

      return generateRectangleBoundary(-newWidth / 2, -newHeight / 2, newWidth, newHeight, cornerRadius);
    })
    .with('heart', () => {
      // Heart border: scale the heart shape outward by borderWidth
      const scaleX = (width + borderWidth * 2) / width;
      const scaleY = (height + borderWidth * 2) / height;
      const newWidth = width * scaleX;
      const newHeight = height * scaleY;

      return generateHeartBoundary(0, 0, newWidth, newHeight);
    })
    .otherwise(() => '');

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Calculate puzzle dimensions and centering offset
 * Grid grows from center: rows append bottom, columns append right
 */
export const calculatePuzzleLayout = (
  state: PuzzleState,
): {
  height: number;
  offsetX: number;
  offsetY: number;
  width: number;
} => {
  const { columns, pieceSize, rows } = state;
  const width = columns * pieceSize;
  const height = rows * pieceSize;

  // For centering: offset is negative half of dimensions
  // This places the puzzle centered at origin (0,0)
  const offsetX = -width / 2;
  const offsetY = -height / 2;

  return { height, offsetX, offsetY, width };
};

/**
 * Generate edge-based puzzle paths for a rectangular puzzle
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
export const generateRectanglePuzzle = (
  state: PuzzleState,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);

  return {
    boundaryPath: generateRectangleBoundary(offsetX, offsetY, width, height),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
  };
};

/**
 * Generate edge-based puzzle paths for an ellipse puzzle
 * Uses truncate-at-boundary approach: rectangular grid clipped by ellipse
 * The ellipse fits the full grid dimensions to maximize piece coverage
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
export const generateCirclePuzzle = (
  state: PuzzleState,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);
  const centerX = 0; // Centered at origin
  const centerY = 0;
  // Use full grid dimensions for ellipse radii (not min)
  const radiusX = width / 2;
  const radiusY = height / 2;

  return {
    boundaryPath: generateEllipseBoundary(centerX, centerY, radiusX, radiusY),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
  };
};

/**
 * Generate edge-based puzzle paths for a heart-shaped puzzle
 * Uses truncate-at-boundary approach: rectangular grid clipped by heart
 * The heart fits the full grid dimensions to maximize piece coverage
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
export const generateHeartPuzzle = (
  state: PuzzleState,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);
  const centerX = 0;
  const centerY = 0;

  return {
    boundaryPath: generateHeartBoundary(centerX, centerY, width, height),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups, jitterMap),
  };
};

/**
 * Main generator function - routes to appropriate shape generator
 * Automatically generates jitter map based on orientation for natural tab variation
 * @param mergeGroups - If provided, skip edges between merged pieces
 */
export const generatePuzzleEdges = (
  state: PuzzleState,
  gridGenerator: string,
  mergeGroups: MergeGroup[] = [],
): PuzzleEdges => {
  // Generate jitter map for natural tab variation based on orientation
  const jitterMap = generateJitterMap(state.rows, state.columns, state.orientation);

  return match(gridGenerator)
    .with(P.union('circle', 'warpedCircle'), () => generateCirclePuzzle(state, mergeGroups, jitterMap))
    .with(P.union('heart', 'warpedHeart'), () => generateHeartPuzzle(state, mergeGroups, jitterMap))
    .otherwise(() => generateRectanglePuzzle(state, mergeGroups, jitterMap));
};

// ============================================================================
// Boundary Check Helpers
// ============================================================================

/**
 * Check if a point is inside an ellipse centered at origin
 */
const isPointInEllipse = (x: number, y: number, radiusX: number, radiusY: number): boolean => {
  // Ellipse equation: (x/rx)² + (y/ry)² <= 1
  return (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;
};

/**
 * Check if a point is inside a heart shape centered at origin
 * Uses the same heart algorithm as generateHeartBoundary
 */
const isPointInHeart = (px: number, py: number, width: number, height: number): boolean => {
  // Heart shape approximation using the mathematical heart curve
  // Transform point to normalized coordinates
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Normalize x to [-1, 1] range
  const nx = px / halfWidth;
  // Normalize y to [-1, 1] range (flip so positive is up in heart coords)
  const ny = -py / halfHeight;

  // Heart curve: (x² + y² - 1)³ - x²y³ <= 0
  // This is an approximation that works well for the standard heart shape
  const x2 = nx * nx;
  const y2 = ny * ny;
  const term1 = x2 + y2 - 1;

  return term1 * term1 * term1 - x2 * ny * ny * ny <= 0;
};

// ============================================================================
// Piece Visibility and Merging
// ============================================================================

/**
 * Check if a point is inside the boundary shape
 */
const isPointInBoundary = (x: number, y: number, gridGenerator: string, width: number, height: number): boolean =>
  match(gridGenerator)
    .with(P.union('circle', 'warpedCircle'), () => isPointInEllipse(x, y, width / 2, height / 2))
    .with(P.union('heart', 'warpedHeart'), () => isPointInHeart(x, y, width, height))
    .otherwise(() => true);

/**
 * Check if a piece at the heart's top center should be force-merged
 * The heart notch at the top center creates partial pieces that should merge.
 *
 * This is a simpler approach: if a piece is in row 0 and near the horizontal center,
 * and it has partial visibility (between 10% and 90%), it should merge with neighbors.
 */
const shouldForceHeartTopMerge = (
  pieceRow: number,
  pieceCol: number,
  visibleRatio: number,
  columns: number,
): boolean => {
  // Only check row 0 (top row where the notch is)
  if (pieceRow !== 0) return false;

  // Only check pieces near the horizontal center
  const centerCol = (columns - 1) / 2;

  if (Math.abs(pieceCol - centerCol) > 1.5) return false;

  // Force merge if piece has partial visibility (affected by notch)
  // Pieces fully inside (>90%) or fully outside (<10%) don't need special handling
  return visibleRatio > 0.1 && visibleRatio < 0.9;
};

/**
 * Check if a piece (by its center) is inside the boundary shape
 */
export const isPieceInsideBoundary = (
  pieceRow: number,
  pieceCol: number,
  state: PuzzleState,
  gridGenerator: string,
): boolean => {
  const { columns, pieceSize, rows } = state;
  const { offsetX, offsetY } = calculatePuzzleLayout(state);

  const centerX = offsetX + (pieceCol + 0.5) * pieceSize;
  const centerY = offsetY + (pieceRow + 0.5) * pieceSize;
  const width = columns * pieceSize;
  const height = rows * pieceSize;

  return isPointInBoundary(centerX, centerY, gridGenerator, width, height);
};

/**
 * Calculate how much of a piece is inside the boundary using grid sampling
 * Returns a ratio from 0 (completely outside) to 1 (completely inside)
 */
const calculatePieceVisibility = (
  pieceRow: number,
  pieceCol: number,
  state: PuzzleState,
  gridGenerator: string,
): number => {
  if (gridGenerator === 'rectangle') return 1;

  const { columns, pieceSize, rows } = state;
  const { offsetX, offsetY } = calculatePuzzleLayout(state);
  const width = columns * pieceSize;
  const height = rows * pieceSize;

  // Sample a 5x5 grid of points within the piece
  const sampleCount = 5;
  let insideCount = 0;

  for (let sy = 0; sy < sampleCount; sy++) {
    for (let sx = 0; sx < sampleCount; sx++) {
      const sampleX = offsetX + (pieceCol + (sx + 0.5) / sampleCount) * pieceSize;
      const sampleY = offsetY + (pieceRow + (sy + 0.5) / sampleCount) * pieceSize;

      if (isPointInBoundary(sampleX, sampleY, gridGenerator, width, height)) {
        insideCount++;
      }
    }
  }

  return insideCount / (sampleCount * sampleCount);
};

/**
 * Calculate visibility for all pieces in the puzzle
 */
export const calculateAllPieceVisibilities = (state: PuzzleState, gridGenerator: string): PieceVisibility[] => {
  const { columns, rows } = state;
  const visibilities: PieceVisibility[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      visibilities.push({
        col,
        row,
        visibleRatio: calculatePieceVisibility(row, col, state, gridGenerator),
      });
    }
  }

  return visibilities;
};

/**
 * Find merge groups for small pieces (< threshold visibility)
 *
 * Uses a two-pass algorithm for better visual consistency:
 * 1. First pass: Merge horizontally (right, then left) - creates horizontal strips
 * 2. Second pass: Merge vertically (bottom, then top) - handles remaining small pieces
 * 3. Third pass: Expand groups until ≥80% visibility
 *
 * Special features:
 * - Heart shape: Detects top center pieces split by the notch and merges them
 * - Odd columns: Center column pieces merge symmetrically with both neighbors
 *
 * This approach creates more consistent merge patterns, especially for shapes like
 * heart where the top center notch can split pieces visually.
 */
export const calculateMergeGroups = (
  visibilities: PieceVisibility[],
  rows: number,
  columns: number,
  threshold: number = 0.5,
  gridGenerator: string = 'rectangle',
  _state?: PuzzleState,
): MergeGroup[] => {
  const mergeGroups: MergeGroup[] = [];
  const processedPieces = new Set<string>();
  // Track pieces that have been merged (but may still need more merging)
  const mergedIntoGroup = new Map<string, number>(); // key -> group index

  const getKey = (row: number, col: number) => `${row}-${col}`;
  const getVisibility = (row: number, col: number) => visibilities.find((v) => v.row === row && v.col === col);

  // Check if this is a center column in an odd-column grid
  const isOddColumns = columns % 2 === 1;
  const centerCol = Math.floor(columns / 2);

  // Helper to check if a piece needs merging
  const needsMerging = (row: number, col: number): boolean => {
    const vis = getVisibility(row, col);

    if (!vis) return false;

    if (vis.visibleRatio <= 0.01) return false; // Completely outside

    if (vis.visibleRatio >= threshold) return false; // Large enough

    return true;
  };

  // Helper to check if a heart top piece should be force-merged
  const shouldForceHeartMerge = (row: number, col: number): boolean => {
    if (gridGenerator !== 'heart') return false;

    const vis = getVisibility(row, col);

    if (!vis) return false;

    return shouldForceHeartTopMerge(row, col, vis.visibleRatio, columns);
  };

  // Helper to try merging a piece in a specific direction
  const tryMerge = (sourceRow: number, sourceCol: number, targetRow: number, targetCol: number): boolean => {
    // Check bounds
    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= columns) {
      return false;
    }

    const sourceKey = getKey(sourceRow, sourceCol);
    const targetKey = getKey(targetRow, targetCol);
    const targetVis = getVisibility(targetRow, targetCol);

    // Skip if target is completely outside
    if (!targetVis || targetVis.visibleRatio <= 0.01) {
      return false;
    }

    // Check if source is already in a group
    const sourceGroupIdx = mergedIntoGroup.get(sourceKey);

    if (sourceGroupIdx !== undefined) {
      // Source is already in a group - check if target can join
      if (mergedIntoGroup.has(targetKey) || processedPieces.has(targetKey)) {
        return false;
      }

      // Add target to existing group
      const group = mergeGroups[sourceGroupIdx];

      group.pieces.push({ col: targetCol, row: targetRow });
      group.sharedEdges.push({
        col1: sourceCol,
        col2: targetCol,
        row1: sourceRow,
        row2: targetRow,
      });
      mergedIntoGroup.set(targetKey, sourceGroupIdx);

      return true;
    }

    // Source is not in a group yet - check if target is available
    if (mergedIntoGroup.has(targetKey) || processedPieces.has(targetKey)) {
      return false;
    }

    // Create new merge group
    const newGroupIdx = mergeGroups.length;

    mergeGroups.push({
      pieces: [
        { col: sourceCol, row: sourceRow },
        { col: targetCol, row: targetRow },
      ],
      sharedEdges: [
        {
          col1: sourceCol,
          col2: targetCol,
          row1: sourceRow,
          row2: targetRow,
        },
      ],
    });
    mergedIntoGroup.set(sourceKey, newGroupIdx);
    mergedIntoGroup.set(targetKey, newGroupIdx);

    return true;
  };

  // Mark completely outside pieces as processed
  for (const piece of visibilities) {
    if (piece.visibleRatio <= 0.01) {
      processedPieces.add(getKey(piece.row, piece.col));
    }
  }

  // ========================================
  // PASS 0: Handle heart top center pieces
  // ========================================
  // For heart shapes, pieces at the top center near the notch should merge with neighbors
  // This creates symmetric merged pieces around the heart notch
  if (gridGenerator === 'heart') {
    for (let col = 0; col < columns; col++) {
      // Only check row 0 (top row with the notch)
      if (shouldForceHeartMerge(0, col)) {
        const key = getKey(0, col);

        if (processedPieces.has(key) || mergedIntoGroup.has(key)) continue;

        // Force merge with both horizontal neighbors for symmetry
        if (col > 0) tryMerge(0, col, 0, col - 1);

        if (col < columns - 1) tryMerge(0, col, 0, col + 1);
      }
    }
  }

  // ========================================
  // PASS 1: Horizontal merging (row by row)
  // ========================================
  // Process each row from left to right, merging small pieces horizontally
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!needsMerging(row, col)) continue;

      const key = getKey(row, col);

      if (processedPieces.has(key)) continue;

      // For odd columns, if this is the center column, merge symmetrically with both sides
      if (isOddColumns && col === centerCol) {
        // Merge with both left and right for symmetry
        if (col > 0) tryMerge(row, col, row, col - 1);

        if (col < columns - 1) tryMerge(row, col, row, col + 1);

        continue;
      }

      // Try to merge with right neighbor first
      if (col + 1 < columns) {
        const rightVis = getVisibility(row, col + 1);

        // Merge if right neighbor exists (either small or large)
        if (rightVis && rightVis.visibleRatio > 0.01) {
          tryMerge(row, col, row, col + 1);
        }
      }

      // If still not merged, try left neighbor
      if (!mergedIntoGroup.has(key) && col - 1 >= 0) {
        const leftVis = getVisibility(row, col - 1);

        if (leftVis && leftVis.visibleRatio > 0.01) {
          tryMerge(row, col, row, col - 1);
        }
      }
    }
  }

  // ========================================
  // PASS 2: Vertical merging (remaining small pieces)
  // ========================================
  // Process remaining unmerged small pieces with vertical merging
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!needsMerging(row, col)) continue;

      const key = getKey(row, col);

      if (processedPieces.has(key)) continue;

      if (mergedIntoGroup.has(key)) continue; // Already merged in horizontal pass

      // Try to merge with bottom neighbor first
      if (row + 1 < rows) {
        const bottomVis = getVisibility(row + 1, col);

        if (bottomVis && bottomVis.visibleRatio > 0.01) {
          tryMerge(row, col, row + 1, col);
        }
      }

      // If still not merged, try top neighbor
      if (!mergedIntoGroup.has(key) && row - 1 >= 0) {
        const topVis = getVisibility(row - 1, col);

        if (topVis && topVis.visibleRatio > 0.01) {
          tryMerge(row, col, row - 1, col);
        }
      }
    }
  }

  // ========================================
  // PASS 3: Ensure minimum visibility (expand groups if needed)
  // ========================================
  // For groups that still have low total visibility, try to expand
  for (let groupIdx = 0; groupIdx < mergeGroups.length; groupIdx++) {
    const group = mergeGroups[groupIdx];
    let totalVisibility = group.pieces.reduce((sum, p) => {
      const vis = getVisibility(p.row, p.col);

      return sum + (vis?.visibleRatio ?? 0);
    }, 0);

    // Keep expanding until we reach 80% or can't expand more
    while (totalVisibility < 0.8) {
      let expanded = false;

      // Try to expand from any piece in the group
      for (const piece of group.pieces) {
        // Try all four directions: right, left, bottom, top
        const neighbors = [
          { col: piece.col + 1, row: piece.row },
          { col: piece.col - 1, row: piece.row },
          { col: piece.col, row: piece.row + 1 },
          { col: piece.col, row: piece.row - 1 },
        ];

        for (const neighbor of neighbors) {
          if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= columns) {
            continue;
          }

          const neighborKey = getKey(neighbor.row, neighbor.col);

          if (mergedIntoGroup.has(neighborKey) || processedPieces.has(neighborKey)) {
            continue;
          }

          const neighborVis = getVisibility(neighbor.row, neighbor.col);

          if (!neighborVis || neighborVis.visibleRatio <= 0.01) {
            continue;
          }

          // Add neighbor to group
          group.pieces.push({ col: neighbor.col, row: neighbor.row });
          group.sharedEdges.push({
            col1: piece.col,
            col2: neighbor.col,
            row1: piece.row,
            row2: neighbor.row,
          });
          mergedIntoGroup.set(neighborKey, groupIdx);
          totalVisibility += neighborVis.visibleRatio;
          expanded = true;
          break;
        }

        if (expanded) break;
      }

      if (!expanded) break;
    }
  }

  // Filter out empty groups (shouldn't happen, but safety check)
  return mergeGroups.filter((g) => g.pieces.length > 1);
};

/**
 * Check if an edge should be skipped (because it's a shared edge between merged pieces)
 */
export const isEdgeShared = (
  row1: number,
  col1: number,
  row2: number,
  col2: number,
  mergeGroups: MergeGroup[],
): boolean =>
  mergeGroups.some((group) =>
    group.sharedEdges.some(
      (edge) =>
        (edge.row1 === row1 && edge.col1 === col1 && edge.row2 === row2 && edge.col2 === col2) ||
        (edge.row1 === row2 && edge.col1 === col2 && edge.row2 === row1 && edge.col2 === col1),
    ),
  );

// ============================================================================
// Preview Helpers (for Konva rendering)
// ============================================================================

/**
 * Generate individual piece paths for preview rendering
 * This reconstructs pieces from edges for visual display
 */
export const generatePuzzlePieces = (state: PuzzleState, _gridGenerator: string): PuzzlePiece[] => {
  const { columns, orientation, pieceSize, rows, tabSize } = state;
  const { offsetX, offsetY } = calculatePuzzleLayout(state);
  const t = getTabSizeFraction(tabSize); // Convert display value to fraction
  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = offsetX + col * pieceSize;
      const y = offsetY + row * pieceSize;

      // Determine edge types for this piece
      const isTopEdge = row === 0;
      const isBottomEdge = row === rows - 1;
      const isLeftEdge = col === 0;
      const isRightEdge = col === columns - 1;

      // Build piece path
      let path = `M ${x.toFixed(2)} ${y.toFixed(2)}`;

      // Top edge
      if (isTopEdge || t === 0) {
        path += ' ' + generateStraightEdge(x + pieceSize, y);
      } else {
        const flip = getTabFlip(row, col, orientation);

        path += ' ' + generateTabCurve(x, y, x + pieceSize, y, t, flip);
      }

      // Right edge
      if (isRightEdge || t === 0) {
        path += ' ' + generateStraightEdge(x + pieceSize, y + pieceSize);
      } else {
        const flip = getTabFlip(row, col + 1, orientation);

        path += ' ' + generateTabCurve(x + pieceSize, y, x + pieceSize, y + pieceSize, t, !flip);
      }

      // Bottom edge (reversed direction)
      if (isBottomEdge || t === 0) {
        path += ' ' + generateStraightEdge(x, y + pieceSize);
      } else {
        const flip = getTabFlip(row + 1, col, orientation);

        path += ' ' + generateTabCurve(x + pieceSize, y + pieceSize, x, y + pieceSize, t, !flip);
      }

      // Left edge (reversed direction)
      if (isLeftEdge || t === 0) {
        path += ' ' + generateStraightEdge(x, y);
      } else {
        const flip = getTabFlip(row, col, orientation);

        path += ' ' + generateTabCurve(x, y + pieceSize, x, y, t, flip);
      }

      path += ' Z';

      pieces.push({ col, path, row });
    }
  }

  return pieces;
};

/**
 * Calculate exploded view position for a piece
 */
export const getExplodedPosition = (
  piece: PuzzlePiece,
  pieceSize: number,
  gap: number = 5,
): { x: number; y: number } => ({
  x: piece.col * (pieceSize + gap),
  y: piece.row * (pieceSize + gap),
});
