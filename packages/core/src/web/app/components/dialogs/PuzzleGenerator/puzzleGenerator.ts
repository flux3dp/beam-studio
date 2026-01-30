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

import { match } from 'ts-pattern';

import { generateShapePath, isPointInShape, type ShapeType } from './shapeGenerators';
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

// Note: Boundary path generation is now in shapeGenerators.ts
// Use generateShapePath() for boundary paths

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
 * Generate edge-based puzzle paths for any shape type
 * Uses consolidated shapeGenerators for boundary paths
 * @param mergeGroups - If provided, skip edges between merged pieces
 * @param jitterMap - Pre-computed jitter coefficients for natural tab variation
 */
const generatePuzzleForShape = (
  state: PuzzleState,
  shapeType: ShapeType,
  mergeGroups: MergeGroup[] = [],
  jitterMap?: PuzzleJitterMap,
): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);

  return {
    boundaryPath: generateShapePath(shapeType, { height, width }),
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

  // Map gridGenerator string to ShapeType
  const shapeType: ShapeType = match(gridGenerator)
    .with('circle', () => 'circle' as const)
    .with('heart', () => 'heart' as const)
    .otherwise(() => 'rectangle' as const);

  return generatePuzzleForShape(state, shapeType, mergeGroups, jitterMap);
};

// ============================================================================
// Piece Visibility and Merging
// ============================================================================

// Note: Boundary check helpers are now in shapeGenerators.ts (isPointInShape)

/**
 * Check if a point is inside the boundary shape
 * Wrapper around isPointInShape that handles gridGenerator string to ShapeType conversion
 */
const isPointInBoundary = (x: number, y: number, gridGenerator: string, width: number, height: number): boolean => {
  const shapeType: ShapeType = match(gridGenerator)
    .with('circle', () => 'circle' as const)
    .with('heart', () => 'heart' as const)
    .otherwise(() => 'rectangle' as const);

  return isPointInShape(x, y, shapeType, width, height);
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
 *
 * Uses a 5x5 interior grid PLUS the 4 corner points PLUS tab tip sampling
 * to catch pieces where:
 * - Very small corners might be missed by the interior grid
 * - The rectangular base is outside but tabs extend into the boundary
 */
const calculatePieceVisibility = (
  pieceRow: number,
  pieceCol: number,
  state: PuzzleState,
  gridGenerator: string,
): number => {
  if (gridGenerator === 'rectangle') return 1;

  const { columns, pieceSize, rows, tabSize } = state;
  const { offsetX, offsetY } = calculatePuzzleLayout(state);
  const width = columns * pieceSize;
  const height = rows * pieceSize;

  // Piece bounds
  const pieceLeft = offsetX + pieceCol * pieceSize;
  const pieceTop = offsetY + pieceRow * pieceSize;
  const pieceRight = pieceLeft + pieceSize;
  const pieceBottom = pieceTop + pieceSize;
  const pieceCenterX = (pieceLeft + pieceRight) / 2;
  const pieceCenterY = (pieceTop + pieceBottom) / 2;

  // Tab geometry: tab extends TAB_DEPTH_MULTIPLIER * t beyond the edge
  const t = getTabSizeFraction(tabSize);
  const tabExtension = TAB_DEPTH_MULTIPLIER * t * pieceSize;

  // Sample a 5x5 grid of points within the piece (interior sampling)
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

  // Also check the 4 corner points to catch very small corners
  const corners = [
    { x: pieceLeft, y: pieceTop }, // top-left
    { x: pieceRight, y: pieceTop }, // top-right
    { x: pieceLeft, y: pieceBottom }, // bottom-left
    { x: pieceRight, y: pieceBottom }, // bottom-right
  ];

  for (const corner of corners) {
    if (isPointInBoundary(corner.x, corner.y, gridGenerator, width, height)) {
      insideCount++;
    }
  }

  // Sample tab regions - tabs can extend beyond the rectangular piece boundary
  // This catches pieces where the base is outside but tabs are inside
  // We sample multiple points along each potential tab (base, middle, tip)
  // and check BOTH directions since flip is determined by jitter map
  const tabSamples: Array<{ x: number; y: number }> = [];

  // For each edge that's not on the puzzle boundary, sample tab points in both directions
  // Tab extends from edge center, at distances: t*pieceSize (base), 2t*pieceSize (middle), 3t*pieceSize (tip)
  const tabDistances = [t * pieceSize, 2 * t * pieceSize, tabExtension];

  // Top edge - check tabs extending both up and down
  if (pieceRow > 0) {
    for (const dist of tabDistances) {
      tabSamples.push({ x: pieceCenterX, y: pieceTop - dist }); // extends up
    }
  }

  // Bottom edge
  if (pieceRow < rows - 1) {
    for (const dist of tabDistances) {
      tabSamples.push({ x: pieceCenterX, y: pieceBottom + dist }); // extends down
    }
  }

  // Left edge
  if (pieceCol > 0) {
    for (const dist of tabDistances) {
      tabSamples.push({ x: pieceLeft - dist, y: pieceCenterY }); // extends left
    }
  }

  // Right edge
  if (pieceCol < columns - 1) {
    for (const dist of tabDistances) {
      tabSamples.push({ x: pieceRight + dist, y: pieceCenterY }); // extends right
    }
  }

  for (const sample of tabSamples) {
    if (isPointInBoundary(sample.x, sample.y, gridGenerator, width, height)) {
      insideCount++;
    }
  }

  // Total samples: 25 (grid) + 4 (corners) + tab samples (up to 4 edges × 3 distances = 12)
  const totalSamples = sampleCount * sampleCount + 4 + tabSamples.length;

  return insideCount / totalSamples;
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
 * Uses a multi-pass algorithm with HORIZONTAL-FIRST priority:
 * 1. PASS 1: Horizontal merging (right, then left) - creates horizontal strips
 * 2. PASS 2: Vertical merging (bottom, then top) - handles remaining pieces
 * 3. PASS 3: Expand groups until ≥80% total visibility
 *
 * Key fix: Small pieces CAN join existing merge groups (neighbor already merged).
 * This ensures no small pieces get "orphaned" when their only valid neighbor
 * was already merged by another small piece.
 */
export const calculateMergeGroups = (
  visibilities: PieceVisibility[],
  rows: number,
  columns: number,
  threshold: number = 0.5,
  _gridGenerator: string = 'rectangle',
  _state?: PuzzleState,
): MergeGroup[] => {
  const mergeGroups: MergeGroup[] = [];
  const mergedIntoGroup = new Map<string, number>(); // key -> group index

  const getKey = (row: number, col: number) => `${row}-${col}`;
  const getVisibility = (row: number, col: number) => visibilities.find((v) => v.row === row && v.col === col);

  // Helper to check if a piece needs merging
  const needsMerging = (row: number, col: number): boolean => {
    const vis = getVisibility(row, col);

    if (!vis) return false;

    if (vis.visibleRatio === 0) return false; // Completely outside (no sample points inside)

    if (vis.visibleRatio >= threshold) return false; // Large enough

    return true;
  };

  // Helper to add a shared edge between two pieces in a group
  const addSharedEdge = (group: MergeGroup, row1: number, col1: number, row2: number, col2: number) => {
    const edgeExists = group.sharedEdges.some(
      (e) =>
        (e.row1 === row1 && e.col1 === col1 && e.row2 === row2 && e.col2 === col2) ||
        (e.row1 === row2 && e.col1 === col2 && e.row2 === row1 && e.col2 === col1),
    );

    if (!edgeExists) {
      group.sharedEdges.push({ col1, col2, row1, row2 });
    }
  };

  // Helper to try merging source piece with target neighbor
  // KEY FIX: Allows joining existing groups!
  const tryMerge = (sourceRow: number, sourceCol: number, targetRow: number, targetCol: number): boolean => {
    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= columns) {
      return false;
    }

    const sourceKey = getKey(sourceRow, sourceCol);
    const targetKey = getKey(targetRow, targetCol);
    const targetVis = getVisibility(targetRow, targetCol);

    // Skip if target is completely outside
    if (!targetVis || targetVis.visibleRatio === 0) {
      return false;
    }

    // Skip if source is already merged
    if (mergedIntoGroup.has(sourceKey)) {
      return false;
    }

    // Check if target is already in a group
    const targetGroupIdx = mergedIntoGroup.get(targetKey);

    if (targetGroupIdx !== undefined) {
      // KEY FIX: Join the target's existing group instead of failing!
      const group = mergeGroups[targetGroupIdx];

      group.pieces.push({ col: sourceCol, row: sourceRow });
      addSharedEdge(group, sourceRow, sourceCol, targetRow, targetCol);
      mergedIntoGroup.set(sourceKey, targetGroupIdx);

      return true;
    }

    // Neither is in a group - create a new group
    const newGroupIdx = mergeGroups.length;

    mergeGroups.push({
      pieces: [
        { col: sourceCol, row: sourceRow },
        { col: targetCol, row: targetRow },
      ],
      sharedEdges: [{ col1: sourceCol, col2: targetCol, row1: sourceRow, row2: targetRow }],
    });
    mergedIntoGroup.set(sourceKey, newGroupIdx);
    mergedIntoGroup.set(targetKey, newGroupIdx);

    return true;
  };

  // ========================================
  // PASS 0: Very small corner pieces (< 25% visibility)
  // ========================================
  // These pieces are at the very corners of non-rectangular shapes.
  // They often have ALL cardinal neighbors either outside the boundary
  // or also very small. We handle them first with extended neighbor search
  // including DIAGONAL neighbors as a last resort.
  //
  // IMPORTANT: Diagonal merges require a "bridge" piece to create a connected
  // region, since diagonally adjacent pieces only share a corner point, not an edge.
  const verySmallThreshold = 0.25;
  const verySmallPieces = visibilities
    .filter((v) => v.visibleRatio > 0 && v.visibleRatio < verySmallThreshold)
    .sort((a, b) => a.visibleRatio - b.visibleRatio); // Smallest first

  // Helper to perform diagonal merge with bridge piece
  const tryDiagonalMerge = (sourceRow: number, sourceCol: number, diagRow: number, diagCol: number): boolean => {
    const sourceKey = getKey(sourceRow, sourceCol);

    if (mergedIntoGroup.has(sourceKey)) return false;

    const diagVis = getVisibility(diagRow, diagCol);

    if (!diagVis || diagVis.visibleRatio === 0) return false;

    // Find a bridge piece (either horizontal or vertical intermediate)
    // Bridge options: (sourceRow, diagCol) or (diagRow, sourceCol)
    const bridgeOptions = [
      { col: diagCol, row: sourceRow }, // horizontal bridge
      { col: sourceCol, row: diagRow }, // vertical bridge
    ];

    for (const bridge of bridgeOptions) {
      if (bridge.row < 0 || bridge.row >= rows || bridge.col < 0 || bridge.col >= columns) {
        continue;
      }

      const bridgeVis = getVisibility(bridge.row, bridge.col);

      // Bridge must have some visibility
      if (!bridgeVis || bridgeVis.visibleRatio === 0) {
        continue;
      }

      const bridgeKey = getKey(bridge.row, bridge.col);
      const diagKey = getKey(diagRow, diagCol);

      // Check if any of the three pieces are already in groups
      const sourceGroupIdx = mergedIntoGroup.get(sourceKey);
      const bridgeGroupIdx = mergedIntoGroup.get(bridgeKey);
      const diagGroupIdx = mergedIntoGroup.get(diagKey);

      // If source is already merged, skip
      if (sourceGroupIdx !== undefined) return false;

      // Case 1: Bridge is in a group - add source to that group
      if (bridgeGroupIdx !== undefined) {
        const group = mergeGroups[bridgeGroupIdx];

        group.pieces.push({ col: sourceCol, row: sourceRow });
        addSharedEdge(group, sourceRow, sourceCol, bridge.row, bridge.col);
        mergedIntoGroup.set(sourceKey, bridgeGroupIdx);

        // Also add diagonal if not in group
        if (diagGroupIdx === undefined) {
          group.pieces.push({ col: diagCol, row: diagRow });
          addSharedEdge(group, bridge.row, bridge.col, diagRow, diagCol);
          mergedIntoGroup.set(diagKey, bridgeGroupIdx);
        }

        return true;
      }

      // Case 2: Diagonal is in a group - add source and bridge to that group
      if (diagGroupIdx !== undefined) {
        const group = mergeGroups[diagGroupIdx];

        // Add bridge first
        group.pieces.push({ col: bridge.col, row: bridge.row });
        addSharedEdge(group, bridge.row, bridge.col, diagRow, diagCol);
        mergedIntoGroup.set(bridgeKey, diagGroupIdx);

        // Then add source
        group.pieces.push({ col: sourceCol, row: sourceRow });
        addSharedEdge(group, sourceRow, sourceCol, bridge.row, bridge.col);
        mergedIntoGroup.set(sourceKey, diagGroupIdx);

        return true;
      }

      // Case 3: None are in groups - create new group with all three
      const newGroupIdx = mergeGroups.length;

      mergeGroups.push({
        pieces: [
          { col: sourceCol, row: sourceRow },
          { col: bridge.col, row: bridge.row },
          { col: diagCol, row: diagRow },
        ],
        sharedEdges: [
          { col1: sourceCol, col2: bridge.col, row1: sourceRow, row2: bridge.row },
          { col1: bridge.col, col2: diagCol, row1: bridge.row, row2: diagRow },
        ],
      });
      mergedIntoGroup.set(sourceKey, newGroupIdx);
      mergedIntoGroup.set(bridgeKey, newGroupIdx);
      mergedIntoGroup.set(diagKey, newGroupIdx);

      return true;
    }

    return false;
  };

  for (const piece of verySmallPieces) {
    const { col, row } = piece;
    const key = getKey(row, col);

    if (mergedIntoGroup.has(key)) continue;

    // Try cardinal neighbors first (horizontal priority)
    const cardinalNeighbors = [
      { col: col + 1, row }, // right
      { col: col - 1, row }, // left
      { col, row: row + 1 }, // bottom
      { col, row: row - 1 }, // top
    ];

    let merged = false;

    for (const neighbor of cardinalNeighbors) {
      if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= columns) {
        continue;
      }

      const neighborVis = getVisibility(neighbor.row, neighbor.col);

      if (!neighborVis || neighborVis.visibleRatio === 0) {
        continue;
      }

      if (tryMerge(row, col, neighbor.row, neighbor.col)) {
        merged = true;
        break;
      }
    }

    if (merged) continue;

    // If cardinal neighbors failed, try diagonal neighbors with bridge
    const diagonalNeighbors = [
      { col: col + 1, row: row + 1 }, // bottom-right
      { col: col - 1, row: row + 1 }, // bottom-left
      { col: col + 1, row: row - 1 }, // top-right
      { col: col - 1, row: row - 1 }, // top-left
    ];

    for (const diag of diagonalNeighbors) {
      if (diag.row < 0 || diag.row >= rows || diag.col < 0 || diag.col >= columns) {
        continue;
      }

      if (tryDiagonalMerge(row, col, diag.row, diag.col)) {
        break;
      }
    }
  }

  // ========================================
  // PASS 1: Horizontal merging (row by row)
  // ========================================
  // Process each row from left to right, prioritizing horizontal merges
  // Direction priority: RIGHT first, then LEFT
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!needsMerging(row, col)) continue;

      const key = getKey(row, col);

      if (mergedIntoGroup.has(key)) continue;

      // Try RIGHT neighbor first (horizontal priority)
      if (col + 1 < columns) {
        const rightVis = getVisibility(row, col + 1);

        if (rightVis && rightVis.visibleRatio > 0) {
          if (tryMerge(row, col, row, col + 1)) continue;
        }
      }

      // Try LEFT neighbor
      if (col - 1 >= 0) {
        const leftVis = getVisibility(row, col - 1);

        if (leftVis && leftVis.visibleRatio > 0) {
          if (tryMerge(row, col, row, col - 1)) continue;
        }
      }
    }
  }

  // ========================================
  // PASS 2: Vertical merging (remaining pieces)
  // ========================================
  // Process remaining unmerged small pieces with vertical merging
  // Direction priority: BOTTOM first, then TOP
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (!needsMerging(row, col)) continue;

      const key = getKey(row, col);

      if (mergedIntoGroup.has(key)) continue;

      // Try BOTTOM neighbor first
      if (row + 1 < rows) {
        const bottomVis = getVisibility(row + 1, col);

        if (bottomVis && bottomVis.visibleRatio > 0) {
          if (tryMerge(row, col, row + 1, col)) continue;
        }
      }

      // Try TOP neighbor
      if (row - 1 >= 0) {
        const topVis = getVisibility(row - 1, col);

        if (topVis && topVis.visibleRatio > 0) {
          if (tryMerge(row, col, row - 1, col)) continue;
        }
      }
    }
  }

  // ========================================
  // PASS 3: Ensure minimum visibility (≥80%)
  // ========================================
  // For groups that still have low total visibility, expand them
  // Direction priority: RIGHT, LEFT, BOTTOM, TOP (horizontal first)
  for (let groupIdx = 0; groupIdx < mergeGroups.length; groupIdx++) {
    const group = mergeGroups[groupIdx];

    let totalVisibility = group.pieces.reduce((sum, p) => {
      const vis = getVisibility(p.row, p.col);

      return sum + (vis?.visibleRatio ?? 0);
    }, 0);

    while (totalVisibility < 0.8) {
      let expanded = false;

      for (const piece of group.pieces) {
        // Horizontal-first neighbor order
        const neighbors = [
          { col: piece.col + 1, row: piece.row }, // right
          { col: piece.col - 1, row: piece.row }, // left
          { col: piece.col, row: piece.row + 1 }, // bottom
          { col: piece.col, row: piece.row - 1 }, // top
        ];

        for (const neighbor of neighbors) {
          if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= columns) {
            continue;
          }

          const neighborKey = getKey(neighbor.row, neighbor.col);

          if (mergedIntoGroup.has(neighborKey)) {
            continue;
          }

          const neighborVis = getVisibility(neighbor.row, neighbor.col);

          if (!neighborVis || neighborVis.visibleRatio === 0) {
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
