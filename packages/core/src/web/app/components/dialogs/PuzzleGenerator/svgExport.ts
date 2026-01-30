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
import { DEFAULT_HEART_SHARPNESS, generateBorderPath, type ShapeType } from './shapeGenerators';
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
 * For heart shapes, uses DEFAULT_HEART_SHARPNESS to match the inner puzzle shape
 */
const generateOuterBorder = (state: PuzzleState, shapeType: ShapeType): string => {
  const { border } = state;
  const { height, width } = calculatePuzzleLayout(state);

  // For heart shape, use the default sharpness to match the inner puzzle
  // For rectangle, use the user-configured corner radius
  const cornerRadius = shapeType === 'heart' ? DEFAULT_HEART_SHARPNESS : border.radius;

  return generateBorderPath(shapeType, {
    borderWidth: border.width,
    cornerRadius,
    height,
    width,
  });
};

/**
 * Calculate the total dimensions of the puzzle including border
 * (Used for assembled view - puzzle and border stacked)
 */
export const calculateTotalDimensions = (state: PuzzleState): { height: number; width: number } => {
  const layout = calculatePuzzleLayout(state);
  const borderOffset = state.border.enabled ? state.border.width * 2 : 0;

  return {
    height: layout.height + borderOffset,
    width: layout.width + borderOffset,
  };
};

/**
 * Gap between puzzle and border in layers view export (in mm)
 */
const LAYERS_EXPORT_GAP = 30;

/**
 * Calculate the layout for layers view export (puzzle and border side-by-side)
 */
export const calculateLayersExportLayout = (
  state: PuzzleState,
): {
  borderHeight: number;
  borderOffsetX: number;
  borderWidth: number;
  hasBorder: boolean;
  puzzleHeight: number;
  puzzleOffsetX: number;
  puzzleWidth: number;
  totalHeight: number;
  totalWidth: number;
} => {
  const layout = calculatePuzzleLayout(state);
  const puzzleWidth = layout.width;
  const puzzleHeight = layout.height;

  if (!state.border.enabled) {
    return {
      borderHeight: 0,
      borderOffsetX: 0,
      borderWidth: 0,
      hasBorder: false,
      puzzleHeight,
      puzzleOffsetX: 0,
      puzzleWidth,
      totalHeight: puzzleHeight,
      totalWidth: puzzleWidth,
    };
  }

  // Border dimensions (puzzle + border width on each side)
  const borderWidth = puzzleWidth + state.border.width * 2;
  const borderHeight = puzzleHeight + state.border.width * 2;

  // Total width = puzzle + gap + border
  const totalWidth = puzzleWidth + LAYERS_EXPORT_GAP + borderWidth;
  const totalHeight = Math.max(puzzleHeight, borderHeight);

  // Center both pieces around the combined center
  // Puzzle center is at: -totalWidth/2 + puzzleWidth/2
  // Border center is at: totalWidth/2 - borderWidth/2
  const puzzleOffsetX = -totalWidth / 2 + puzzleWidth / 2;
  const borderOffsetX = totalWidth / 2 - borderWidth / 2;

  return {
    borderHeight,
    borderOffsetX,
    borderWidth,
    hasBorder: true,
    puzzleHeight,
    puzzleOffsetX,
    puzzleWidth,
    totalHeight,
    totalWidth,
  };
};

// ============================================================================
// Canvas Export
// ============================================================================

interface SvgStringOptions {
  /** Clip path data for non-rectangular shapes */
  clipPathData?: string;
  /** Element offset from combined center (for layers view) */
  elementOffsetX?: number;
  /** Total SVG height */
  height: number;
  /** Path data to render */
  pathData: string;
  /** Stroke color */
  strokeColor?: string;
  /** Total SVG width */
  width: number;
}

/**
 * Create an SVG string for import into Beam Studio canvas
 * The puzzle is centered at origin, so we need to translate to positive coordinates
 * Optionally applies a clip-path to constrain the path to a boundary shape
 */
const createSvgString = (options: SvgStringOptions): string => {
  const { clipPathData, elementOffsetX = 0, height, pathData, strokeColor = '#000000', width } = options;

  // Translate paths from centered (-w/2, -h/2) to positive coordinates (0, 0)
  // Plus any element offset for layers view positioning
  const translateX = width / 2 + elementOffsetX;
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
 * Export puzzle to Beam Studio canvas with layers view layout
 * Puzzle and border are placed side-by-side with a gap between them
 *
 * Creates separate layers for:
 * - Puzzle Inner Cuts (horizontal + vertical edges)
 * - Puzzle Boundary (shape outline)
 * - Puzzle Border - Separate Material (outer frame, if enabled)
 */
export const exportToCanvas = async (state: PuzzleState, typeConfig: PuzzleTypeConfig): Promise<void> => {
  // Dynamically import to avoid circular dependencies
  const { default: importSvgString } = await import('@core/app/svgedit/operations/import/importSvgString');

  const exportPaths = generateExportPaths(state, typeConfig);
  const layersLayout = calculateLayersExportLayout(state);
  const isRectangle = typeConfig.gridGenerator === 'rectangle';

  // Use layers layout dimensions (puzzle + gap + border side-by-side)
  const { puzzleOffsetX, totalHeight, totalWidth } = layersLayout;

  // Combine all edge cuts into one path
  const allCuts = [exportPaths.horizontalEdges, exportPaths.verticalEdges].filter(Boolean).join(' ');

  // Import puzzle cuts layer (positioned at puzzle offset)
  // For non-rectangular shapes, use clip-path to clip edges to boundary
  if (allCuts) {
    const clipPath = isRectangle ? undefined : exportPaths.boundaryPath;
    const cutsSvg = createSvgString({
      clipPathData: clipPath,
      elementOffsetX: puzzleOffsetX,
      height: totalHeight,
      pathData: allCuts,
      strokeColor: '#000000',
      width: totalWidth,
    });

    await importSvgString(cutsSvg, {
      layerName: 'Puzzle Inner Cuts',
      type: 'layer',
    });
  }

  // Import boundary layer (positioned at puzzle offset)
  if (exportPaths.boundaryPath) {
    const boundarySvg = createSvgString({
      elementOffsetX: puzzleOffsetX,
      height: totalHeight,
      pathData: exportPaths.boundaryPath,
      width: totalWidth,
    });

    await importSvgString(boundarySvg, {
      layerName: 'Puzzle Boundary',
      type: 'layer',
    });
  }

  // Import outer border layer (positioned at border offset - right side)
  if (exportPaths.outerBorderPath && layersLayout.hasBorder) {
    const borderSvg = createSvgString({
      elementOffsetX: layersLayout.borderOffsetX,
      height: totalHeight,
      pathData: exportPaths.outerBorderPath,
      strokeColor: '#0000ff',
      width: totalWidth,
    });

    await importSvgString(borderSvg, {
      layerName: 'Puzzle Border (Separate Material)',
      type: 'layer',
    });
  }
};
