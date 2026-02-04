/**
 * Unified Puzzle Geometry Service
 *
 * Single source of truth for all puzzle geometry calculations.
 * Used by both Preview.tsx (rendering) and svgExport.ts (export).
 *
 * This consolidation:
 * 1. Eliminates duplicate calculations between preview and export
 * 2. Ensures consistent geometry across the application
 * 3. Makes memoization straightforward at the component level
 */

import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
  type MergeGroup,
  type PuzzleEdges,
} from './puzzleGenerator';
import {
  generateBorderPath,
  generateRaisedEdgesPath,
  generateShapePath,
  getShapeMetadata,
  type ShapeType,
} from './shapeGenerators';
import type { PuzzleState } from './types';

/** Gap between puzzle and board in exploded view (mm) */
export const LAYER_GAP = 30;

export interface PuzzleLayout {
  height: number;
  offsetX: number;
  offsetY: number;
  width: number;
}

export interface PuzzleGeometry {
  /** Board base outer boundary path (if border enabled) */
  boardBasePath?: string;
  /** Shape boundary path for clipping */
  boundaryPath: string;
  /** Puzzle edge paths */
  edges: PuzzleEdges;
  /** Frame dimensions (puzzle + border) */
  frameHeight: number;
  frameWidth: number;
  /** Base layout info */
  layout: PuzzleLayout;
  /** Merge groups for shapes that don't fill their bounding box */
  mergeGroups: MergeGroup[];
  /** Raised edges frame path with inner cutout (if border enabled) */
  raisedEdgesPath?: string;
  /** Total dimensions for view scaling */
  totalHeight: number;
  totalWidth: number;
}

/**
 * Computes all puzzle geometry in a single pass.
 *
 * @param state - Current puzzle state
 * @param shapeType - Shape type from config
 * @returns Complete geometry data for rendering and export
 */
export const computePuzzleGeometry = (state: PuzzleState, shapeType: ShapeType): PuzzleGeometry => {
  const layout = calculatePuzzleLayout(state);
  const meta = getShapeMetadata(shapeType, state);

  // Visibility & merging (expensive - skip when shape fills its bounding box)
  const mergeGroups = meta.fillsBoundingBox
    ? []
    : calculateMergeGroups(calculateAllPieceVisibilities(state, shapeType), state.rows, state.columns);

  const edges = generatePuzzleEdges(state, shapeType, mergeGroups);
  const boundaryPath = generateShapePath(shapeType, {
    cornerRadius: meta.boundaryCornerRadius,
    height: layout.height,
    width: layout.width,
  });

  // Border paths (conditional)
  let boardBasePath: string | undefined;
  let raisedEdgesPath: string | undefined;

  if (state.border.enabled) {
    const borderOpts = {
      borderWidth: state.border.width,
      cornerRadius: meta.borderCornerRadius,
      height: layout.height,
      width: layout.width,
    };

    boardBasePath = generateBorderPath(shapeType, borderOpts);
    raisedEdgesPath = generateRaisedEdgesPath(shapeType, {
      ...borderOpts,
      innerCornerRadius: meta.innerCutoutCornerRadius,
    });
  }

  // Pre-compute dimensions for layout calculations
  const frameWidth = layout.width + (state.border.enabled ? state.border.width * 2 : 0);
  const frameHeight = layout.height + (state.border.enabled ? state.border.width * 2 : 0);

  // Total dimensions depend on whether we're showing exploded view with border
  const hasBorderLayout = state.border.enabled;
  const totalWidth = hasBorderLayout ? frameWidth * 2 + LAYER_GAP : layout.width;
  const totalHeight = hasBorderLayout ? frameHeight : layout.height;

  return {
    boardBasePath,
    boundaryPath,
    edges,
    frameHeight,
    frameWidth,
    layout,
    mergeGroups,
    raisedEdgesPath,
    totalHeight,
    totalWidth,
  };
};

/**
 * Computes export-specific layout positions.
 * Used by svgExport.ts for placing elements in the final SVG.
 */
export const computeExportLayout = (geometry: PuzzleGeometry, borderEnabled: boolean) => {
  if (!borderEnabled) {
    return {
      boardOffsetX: 0,
      hasBorder: false,
      raisedEdgesOffsetX: 0,
      totalHeight: geometry.layout.height,
      totalWidth: geometry.layout.width,
    };
  }

  const totalW = geometry.frameWidth * 2 + LAYER_GAP;

  return {
    boardOffsetX: totalW / 2 - geometry.frameWidth / 2,
    hasBorder: true,
    raisedEdgesOffsetX: -totalW / 2 + geometry.frameWidth / 2,
    totalHeight: geometry.frameHeight,
    totalWidth: totalW,
  };
};
