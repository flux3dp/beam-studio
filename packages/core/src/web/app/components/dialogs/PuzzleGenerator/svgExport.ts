/**
 * SVG Export Module for Puzzle Generator
 *
 * Handles:
 * - Path intersection with shape boundary (using Paper.js)
 * - Small piece detection and merging (< 50% threshold)
 * - Export to Beam Studio canvas with proper layers
 */

import * as paper from 'paper';

import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generateBorderPath,
  generatePuzzleEdges,
} from './puzzleGenerator';
import type { PuzzleState, PuzzleTypeConfig } from './types';

// ============================================================================
// Types
// ============================================================================

interface ExportedPiece {
  area: number;
  col: number;
  isEdgePiece: boolean;
  path: string;
  row: number;
  visibleRatio: number; // Ratio of visible area to original area (0-1)
}

interface ExportResult {
  boundaryPath: string;
  cutPaths: string[]; // Individual piece cut paths
  horizontalEdges: string;
  outerBorderPath?: string; // Optional decorative border
  verticalEdges: string;
}

// ============================================================================
// Paper.js Helpers
// ============================================================================

/**
 * Initialize a Paper.js project for path operations
 */
const createPaperProject = (): paper.Project => new paper.Project(document.createElement('canvas'));

/**
 * Parse an SVG path string into a Paper.js Path
 */
const parsePath = (pathData: string, project: paper.Project): paper.CompoundPath | paper.Path => {
  const svg = `<svg><path d="${pathData}"/></svg>`;
  const items = project.importSVG(svg);
  const pathItem = items.children[0] as paper.CompoundPath | paper.Path;
  const cloned = pathItem.clone();

  items.remove();

  return cloned;
};

/**
 * Convert a Paper.js path back to SVG path data
 */
const pathToSvgData = (path: paper.CompoundPath | paper.Path): string => path.pathData;

/**
 * Calculate the area of a path (absolute value for compound paths)
 */
const getPathArea = (path: paper.CompoundPath | paper.Path): number => Math.abs(path.area);

// ============================================================================
// Piece Intersection and Clipping
// ============================================================================

/**
 * Generate a single piece path from its edges
 * This reconstructs a piece from the edge-based generation
 */
const generatePiecePath = (row: number, col: number, state: PuzzleState): string => {
  const { pieceSize } = state;
  const { offsetX, offsetY } = calculatePuzzleLayout(state);

  const x = offsetX + col * pieceSize;
  const y = offsetY + row * pieceSize;

  // For simplicity, generate rectangular piece paths
  // The tabs are handled by the edge paths which will be intersected later
  return [
    `M ${x.toFixed(2)} ${y.toFixed(2)}`,
    `L ${(x + pieceSize).toFixed(2)} ${y.toFixed(2)}`,
    `L ${(x + pieceSize).toFixed(2)} ${(y + pieceSize).toFixed(2)}`,
    `L ${x.toFixed(2)} ${(y + pieceSize).toFixed(2)}`,
    'Z',
  ].join(' ');
};

/**
 * Intersect a piece with the boundary shape and calculate visible ratio
 */
const intersectPieceWithBoundary = (
  piecePath: string,
  boundaryPath: string,
  project: paper.Project,
): null | { area: number; clippedPath: string; visibleRatio: number } => {
  try {
    const piece = parsePath(piecePath, project);
    const boundary = parsePath(boundaryPath, project);

    const originalArea = getPathArea(piece);

    if (originalArea === 0) {
      piece.remove();
      boundary.remove();

      return null;
    }

    // Perform intersection
    const intersected = piece.intersect(boundary);
    const intersectedArea = getPathArea(intersected);
    const visibleRatio = intersectedArea / originalArea;

    const result = {
      area: intersectedArea,
      clippedPath: pathToSvgData(intersected),
      visibleRatio,
    };

    // Cleanup
    piece.remove();
    boundary.remove();
    intersected.remove();

    return result;
  } catch (error) {
    console.error('Error intersecting piece with boundary:', error);

    return null;
  }
};

// ============================================================================
// Small Piece Merging
// ============================================================================

/**
 * Find the best neighbor to merge a small piece with
 * Prefers neighbors that are also edge pieces (to maintain edge continuity)
 */
const findMergeTarget = (
  piece: ExportedPiece,
  pieces: ExportedPiece[],
  rows: number,
  cols: number,
): ExportedPiece | null => {
  const { col, row } = piece;

  // Check neighbors in order: right, bottom, left, top
  const neighbors = [
    { col: col + 1, row },
    { col, row: row + 1 },
    { col: col - 1, row },
    { col, row: row - 1 },
  ];

  for (const neighbor of neighbors) {
    if (neighbor.row >= 0 && neighbor.row < rows && neighbor.col >= 0 && neighbor.col < cols) {
      const target = pieces.find((p) => p.row === neighbor.row && p.col === neighbor.col);

      // Only merge with pieces that have > 50% visible (not also small)
      if (target && target.visibleRatio >= 0.5) {
        return target;
      }
    }
  }

  return null;
};

/**
 * Merge two piece paths using Paper.js union operation
 */
const mergePieces = (piece1Path: string, piece2Path: string, project: paper.Project): string => {
  const path1 = parsePath(piece1Path, project);
  const path2 = parsePath(piece2Path, project);

  const united = path1.unite(path2);
  const result = pathToSvgData(united);

  path1.remove();
  path2.remove();
  united.remove();

  return result;
};

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Process all puzzle pieces, clip to boundary, and merge small pieces
 */
export const processPuzzlePieces = (
  state: PuzzleState,
  typeConfig: PuzzleTypeConfig,
  mergeThreshold: number = 0.5,
): ExportedPiece[] => {
  const project = createPaperProject();
  const edges = generatePuzzleEdges(state, typeConfig.gridGenerator);
  const { columns, rows } = state;

  // Generate and process all pieces
  const allPieces: ExportedPiece[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const piecePath = generatePiecePath(row, col, state);
      const result = intersectPieceWithBoundary(piecePath, edges.boundaryPath, project);

      if (result && result.visibleRatio > 0.01) {
        // Skip completely outside pieces
        allPieces.push({
          area: result.area,
          col,
          isEdgePiece: row === 0 || row === rows - 1 || col === 0 || col === columns - 1,
          path: result.clippedPath,
          row,
          visibleRatio: result.visibleRatio,
        });
      }
    }
  }

  // Merge small pieces (< threshold) with neighbors
  const mergedPieces: ExportedPiece[] = [];
  const processedPieces = new Set<string>();

  for (const piece of allPieces) {
    const key = `${piece.row}-${piece.col}`;

    if (processedPieces.has(key)) continue;

    if (piece.visibleRatio < mergeThreshold) {
      // Find a neighbor to merge with
      const target = findMergeTarget(piece, allPieces, rows, columns);

      if (target) {
        const targetKey = `${target.row}-${target.col}`;

        // Merge the pieces
        const mergedPath = mergePieces(piece.path, target.path, project);

        mergedPieces.push({
          area: piece.area + target.area,
          col: target.col,
          isEdgePiece: target.isEdgePiece || piece.isEdgePiece,
          path: mergedPath,
          row: target.row,
          visibleRatio: 1, // Merged piece is now "full"
        });

        processedPieces.add(key);
        processedPieces.add(targetKey);
      } else {
        // No valid merge target, keep the piece as-is
        mergedPieces.push(piece);
        processedPieces.add(key);
      }
    } else {
      mergedPieces.push(piece);
      processedPieces.add(key);
    }
  }

  project.remove();

  return mergedPieces;
};

/**
 * Generate all export paths for the puzzle
 * This is the main export function that prepares paths for Beam Studio canvas
 * Includes small piece merging - edges between merged pieces are removed
 */
export const generateExportPaths = (state: PuzzleState, typeConfig: PuzzleTypeConfig): ExportResult => {
  const project = createPaperProject();
  const isRectangle = typeConfig.gridGenerator === 'rectangle';

  // Calculate merge groups for non-rectangle shapes (small pieces < 50% visibility)
  const mergeGroups = isRectangle
    ? []
    : calculateMergeGroups(
        calculateAllPieceVisibilities(state, typeConfig.gridGenerator),
        state.rows,
        state.columns,
        0.5,
        typeConfig.gridGenerator,
        state,
      );

  // Generate edges with merged piece edges removed
  const edges = generatePuzzleEdges(state, typeConfig.gridGenerator, mergeGroups);

  // For rectangular puzzles, we don't need to clip
  if (isRectangle) {
    project.remove();

    return {
      boundaryPath: edges.boundaryPath,
      cutPaths: [],
      horizontalEdges: edges.horizontalEdges,
      outerBorderPath: state.border.enabled ? generateOuterBorder(state, typeConfig) : undefined,
      verticalEdges: edges.verticalEdges,
    };
  }

  // For non-rectangular shapes, export edges without clipping
  // The boundary cut will separate inside from outside - extra cuts outside don't affect the final piece
  // Note: Paper.js intersect() doesn't work well for open stroke paths (produces flat lines)
  project.remove();

  return {
    boundaryPath: edges.boundaryPath,
    cutPaths: [],
    horizontalEdges: edges.horizontalEdges,
    outerBorderPath: state.border.enabled ? generateOuterBorder(state, typeConfig) : undefined,
    verticalEdges: edges.verticalEdges,
  };
};

/**
 * Generate the outer decorative border (if enabled)
 * Uses the shared generateBorderPath function from puzzleGenerator
 */
const generateOuterBorder = (state: PuzzleState, typeConfig: PuzzleTypeConfig): string => {
  const { border } = state;
  const { height, width } = calculatePuzzleLayout(state);

  return generateBorderPath(typeConfig.gridGenerator, width, height, border.width, border.radius);
};

/**
 * Calculate the total dimensions of the puzzle including border
 */
export const calculateTotalDimensions = (state: PuzzleState): { height: number; width: number } => {
  const layout = calculatePuzzleLayout(state);
  const borderOffset = state.border.enabled ? state.border.width * 2 : 0;

  return {
    height: layout.height + borderOffset,
    width: layout.width + borderOffset,
  };
};

// ============================================================================
// Canvas Export
// ============================================================================

/**
 * Create an SVG string for import into Beam Studio canvas
 * The puzzle is centered at origin, so we need to translate to positive coordinates
 * Optionally applies a clip-path to constrain the path to a boundary shape
 */
const createSvgString = (
  pathData: string,
  width: number,
  height: number,
  strokeColor: string = '#000000',
  clipPathData?: string,
): string => {
  // Translate paths from centered (-w/2, -h/2) to positive coordinates (0, 0)
  const translateX = width / 2;
  const translateY = height / 2;

  // If clip path is provided, use SVG clipPath element to clip the edges
  // Key insight: Both the clip-path shape and the content paths are centered at origin.
  // We translate the entire group (including both) together, so they stay aligned.
  // The clipPath is defined without transform - it uses the same coordinate space as the paths.
  if (clipPathData) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
    <defs>
      <clipPath id="boundaryClip">
        <path d="${clipPathData}"/>
      </clipPath>
    </defs>
    <g transform="translate(${translateX}, ${translateY})">
      <g clip-path="url(#boundaryClip)">
        <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="0.1"/>
      </g>
    </g>
  </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
    <g transform="translate(${translateX}, ${translateY})">
      <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="0.1"/>
    </g>
  </svg>`;
};

/**
 * Export puzzle to Beam Studio canvas
 * Creates separate layers for:
 * - Puzzle Cuts (horizontal + vertical edges)
 * - Puzzle Boundary (shape outline)
 * - Puzzle Border (outer frame, if enabled)
 */
export const exportToCanvas = async (state: PuzzleState, typeConfig: PuzzleTypeConfig): Promise<void> => {
  // Dynamically import to avoid circular dependencies
  const { default: importSvgString } = await import('@core/app/svgedit/operations/import/importSvgString');

  const exportPaths = generateExportPaths(state, typeConfig);
  const { height, width } = calculateTotalDimensions(state);
  const isRectangle = typeConfig.gridGenerator === 'rectangle';

  // Combine all edge cuts into one path
  const allCuts = [exportPaths.horizontalEdges, exportPaths.verticalEdges].filter(Boolean).join(' ');

  // Import puzzle cuts layer
  // For non-rectangular shapes, use clip-path to clip edges to boundary
  if (allCuts) {
    const clipPath = isRectangle ? undefined : exportPaths.boundaryPath;
    const cutsSvg = createSvgString(allCuts, width, height, '#000000', clipPath);

    await importSvgString(cutsSvg, {
      layerName: 'Puzzle Cuts',
      type: 'layer',
    });
  }

  // Import boundary layer
  if (exportPaths.boundaryPath) {
    const boundarySvg = createSvgString(exportPaths.boundaryPath, width, height);

    await importSvgString(boundarySvg, {
      layerName: 'Puzzle Boundary',
      type: 'layer',
    });
  }

  // Import outer border layer (if enabled)
  if (exportPaths.outerBorderPath) {
    const borderSvg = createSvgString(exportPaths.outerBorderPath, width, height, '#0000ff');

    await importSvgString(borderSvg, {
      layerName: 'Puzzle Border',
      type: 'layer',
    });
  }
};
