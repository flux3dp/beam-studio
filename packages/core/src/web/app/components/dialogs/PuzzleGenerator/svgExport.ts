/**
 * SVG Export Module for Puzzle Generator
 *
 * Handles:
 * - SVG path generation for laser cutting
 * - Small piece merging (< 50% threshold)
 * - Export to Beam Studio canvas with proper layers
 */

import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
} from './puzzleGenerator';
import { generateBorderPath, type ShapeType } from './shapeGenerators';
import type { PuzzleState, PuzzleTypeConfig } from './types';

// ============================================================================
// Types
// ============================================================================

interface ExportResult {
  boundaryPath: string;
  horizontalEdges: string;
  outerBorderPath?: string;
  verticalEdges: string;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Generate all export paths for the puzzle
 * Includes small piece merging - edges between merged pieces are removed
 */
export const generateExportPaths = (state: PuzzleState, typeConfig: PuzzleTypeConfig): ExportResult => {
  const isRectangle = typeConfig.gridGenerator === 'rectangle';
  const shapeType = typeConfig.gridGenerator as ShapeType;

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

  // Generate outer border if enabled
  const outerBorderPath = state.border.enabled ? generateOuterBorder(state, shapeType) : undefined;

  return {
    boundaryPath: edges.boundaryPath,
    horizontalEdges: edges.horizontalEdges,
    outerBorderPath,
    verticalEdges: edges.verticalEdges,
  };
};

/**
 * Generate the outer decorative border (if enabled)
 */
const generateOuterBorder = (state: PuzzleState, shapeType: ShapeType): string => {
  const { border } = state;
  const { height, width } = calculatePuzzleLayout(state);

  return generateBorderPath(shapeType, {
    borderWidth: border.width,
    cornerRadius: border.radius,
    height,
    width,
  });
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
 * - Puzzle Inner Cuts (horizontal + vertical edges)
 * - Puzzle Boundary (shape outline)
 * - Puzzle Border - Separate Material (outer frame, if enabled)
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
      layerName: 'Puzzle Inner Cuts',
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
      layerName: 'Puzzle Border (Separate Material)',
      type: 'layer',
    });
  }
};
