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

import type { PuzzleState } from './types';

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

// ============================================================================
// Bezier Curve Tab Generation
// ============================================================================

/**
 * Generate a single tab edge using cubic Bezier curves
 * Based on Draradech's 10-point Bezier profile
 *
 * @param startX - Start X coordinate
 * @param startY - Start Y coordinate
 * @param endX - End X coordinate
 * @param endY - End Y coordinate
 * @param tabSize - Tab size as fraction (0-0.3)
 * @param flip - true = tab bulges in positive perpendicular direction
 */
const generateTabCurve = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tabSize: number,
  flip: boolean,
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

  // Helper to compute point along edge with perpendicular offset
  const point = (alongEdge: number, perpOffset: number): { x: number; y: number } => ({
    x: startX + dx * alongEdge + wx * perpOffset * length * flipMult,
    y: startY + dy * alongEdge + wy * perpOffset * length * flipMult,
  });

  // Control points defining the tab profile (p1-p9, p0 is implicit start point)
  // Based on deterministic version (no jitter)
  const p1 = point(0.2, 0.0);
  const p2 = point(0.5, -t);
  const p3 = point(0.5 - t, t);
  const p4 = point(0.5 - 2.0 * t, TAB_DEPTH_MULTIPLIER * t);
  const p5 = point(0.5 + 2.0 * t, TAB_DEPTH_MULTIPLIER * t);
  const p6 = point(0.5 + t, t);
  const p7 = point(0.5, -t);
  const p8 = point(0.8, 0.0);
  const p9 = point(1.0, 0.0);

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
 */
const generateHorizontalEdges = (
  state: PuzzleState,
  offsetX: number,
  offsetY: number,
  mergeGroups: MergeGroup[] = [],
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

      const flip = getTabFlip(yi, xi, orientation);

      if (t > 0) {
        pathData += ' ' + generateTabCurve(x1, y, x2, y, t, flip);
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
 */
const generateVerticalEdges = (
  state: PuzzleState,
  offsetX: number,
  offsetY: number,
  mergeGroups: MergeGroup[] = [],
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

      // Use offset orientation for vertical edges to ensure proper interlocking
      const flip = getTabFlip(yi, xi, orientation);

      if (t > 0) {
        pathData += ' ' + generateTabCurve(x, y1, x, y2, t, !flip); // Invert flip for vertical
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
 */
export const generateRectanglePuzzle = (state: PuzzleState, mergeGroups: MergeGroup[] = []): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);

  return {
    boundaryPath: generateRectangleBoundary(offsetX, offsetY, width, height),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups),
  };
};

/**
 * Generate edge-based puzzle paths for an ellipse puzzle
 * Uses truncate-at-boundary approach: rectangular grid clipped by ellipse
 * The ellipse fits the full grid dimensions to maximize piece coverage
 * @param mergeGroups - If provided, skip edges between merged pieces
 */
export const generateCirclePuzzle = (state: PuzzleState, mergeGroups: MergeGroup[] = []): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);
  const centerX = 0; // Centered at origin
  const centerY = 0;
  // Use full grid dimensions for ellipse radii (not min)
  const radiusX = width / 2;
  const radiusY = height / 2;

  return {
    boundaryPath: generateEllipseBoundary(centerX, centerY, radiusX, radiusY),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups),
  };
};

/**
 * Generate edge-based puzzle paths for a heart-shaped puzzle
 * Uses truncate-at-boundary approach: rectangular grid clipped by heart
 * The heart fits the full grid dimensions to maximize piece coverage
 * @param mergeGroups - If provided, skip edges between merged pieces
 */
export const generateHeartPuzzle = (state: PuzzleState, mergeGroups: MergeGroup[] = []): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);
  const centerX = 0;
  const centerY = 0;

  return {
    boundaryPath: generateHeartBoundary(centerX, centerY, width, height),
    horizontalEdges: generateHorizontalEdges(state, offsetX, offsetY, mergeGroups),
    verticalEdges: generateVerticalEdges(state, offsetX, offsetY, mergeGroups),
  };
};

/**
 * Main generator function - routes to appropriate shape generator
 * @param mergeGroups - If provided, skip edges between merged pieces
 */
export const generatePuzzleEdges = (
  state: PuzzleState,
  gridGenerator: string,
  mergeGroups: MergeGroup[] = [],
): PuzzleEdges =>
  match(gridGenerator)
    .with(P.union('circle', 'warpedCircle'), () => generateCirclePuzzle(state, mergeGroups))
    .with(P.union('heart', 'warpedHeart'), () => generateHeartPuzzle(state, mergeGroups))
    .otherwise(() => generateRectanglePuzzle(state, mergeGroups));

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
 * Uses iterative merging: keeps merging until combined visibility >= 80%
 * Direction priority: right, left, bottom, top (takes first valid neighbor)
 */
export const calculateMergeGroups = (
  visibilities: PieceVisibility[],
  rows: number,
  columns: number,
  threshold: number = 0.5,
): MergeGroup[] => {
  const mergeGroups: MergeGroup[] = [];
  const processedPieces = new Set<string>();

  const getKey = (row: number, col: number) => `${row}-${col}`;
  const getVisibility = (row: number, col: number) => visibilities.find((v) => v.row === row && v.col === col);

  // Helper to get neighbors in priority order: right, left, bottom, top
  const getNeighborsInOrder = (row: number, col: number) => [
    { col: col + 1, row }, // right
    { col: col - 1, row }, // left
    { col, row: row + 1 }, // bottom
    { col, row: row - 1 }, // top
  ];

  // Find small pieces and merge them with neighbors
  for (const piece of visibilities) {
    const key = getKey(piece.row, piece.col);

    if (processedPieces.has(key)) {
      continue;
    }

    if (piece.visibleRatio >= threshold) {
      // Not a small piece
      continue;
    }

    if (piece.visibleRatio <= 0.01) {
      // Completely outside - skip entirely
      processedPieces.add(key);
      continue;
    }

    // Start a merge group with this small piece
    const groupPieces: Array<{ col: number; row: number; visibility: number }> = [
      { col: piece.col, row: piece.row, visibility: piece.visibleRatio },
    ];
    const sharedEdges: MergeGroup['sharedEdges'] = [];
    let totalVisibility = piece.visibleRatio;

    processedPieces.add(key);

    // Keep merging until we have >= 80% visibility
    while (totalVisibility < 0.8) {
      let foundNeighbor = false;

      // Try to find a neighbor for any piece in the current group
      for (const groupPiece of groupPieces) {
        const neighbors = getNeighborsInOrder(groupPiece.row, groupPiece.col);

        for (const neighbor of neighbors) {
          // Check bounds
          if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= columns) {
            continue;
          }

          const neighborKey = getKey(neighbor.row, neighbor.col);

          // Skip if already processed or already in group
          if (processedPieces.has(neighborKey)) {
            continue;
          }

          const neighborVis = getVisibility(neighbor.row, neighbor.col);

          // Skip if completely outside
          if (!neighborVis || neighborVis.visibleRatio <= 0.01) {
            continue;
          }

          // Found a valid neighbor - add to group
          groupPieces.push({
            col: neighbor.col,
            row: neighbor.row,
            visibility: neighborVis.visibleRatio,
          });
          sharedEdges.push({
            col1: groupPiece.col,
            col2: neighbor.col,
            row1: groupPiece.row,
            row2: neighbor.row,
          });
          totalVisibility += neighborVis.visibleRatio;
          processedPieces.add(neighborKey);
          foundNeighbor = true;
          break; // Take first valid neighbor, then re-evaluate
        }

        if (foundNeighbor) {
          break;
        }
      }

      // If no neighbor found for any piece in group, stop merging
      if (!foundNeighbor) {
        break;
      }
    }

    // Only create merge group if we actually merged pieces (more than 1 piece)
    if (groupPieces.length > 1) {
      mergeGroups.push({
        pieces: groupPieces.map((p) => ({ col: p.col, row: p.row })),
        sharedEdges,
      });
    }
  }

  return mergeGroups;
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
