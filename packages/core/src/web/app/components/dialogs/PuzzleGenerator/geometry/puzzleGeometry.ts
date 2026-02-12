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

import { LAYER_GAP } from '../constants';
import type { PuzzleGeometry, PuzzleState, ShapeType } from '../types';

import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
} from './puzzleGenerator';
import { generateBorderPath, generateRaisedEdgesPath, generateShapePath, getShapeMetadata } from './shapes';

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
    : calculateMergeGroups(
        calculateAllPieceVisibilities(
          state,
          shapeType,
          layout,
          meta.centerYOffset,
          meta.boundaryHeight,
          meta.boundaryCornerRadius,
        ),
        state.rows,
        state.columns,
      );

  const edges = generatePuzzleEdges(state, layout, mergeGroups);

  // Boundary path: use boundaryHeight (stretched for heart) and centerYOffset
  const boundaryPath = generateShapePath(shapeType, {
    centerY: meta.centerYOffset,
    cornerRadius: meta.boundaryCornerRadius,
    height: meta.boundaryHeight,
    width: layout.width,
  });

  // Border paths
  let boardBasePath: string | undefined;
  let raisedEdgesPath: string | undefined;

  if (state.border.enabled) {
    const borderOpts = {
      borderWidth: state.border.width,
      centerY: meta.centerYOffset,
      cornerRadius: meta.borderCornerRadius,
      height: meta.boundaryHeight,
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
  const frameHeight = meta.boundaryHeight + (state.border.enabled ? state.border.width * 2 : 0);

  return {
    boardBasePath,
    boundaryPath,
    edges,
    frameHeight,
    frameWidth,
    layout,
    mergeGroups,
    meta,
    raisedEdgesPath,
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
  const boardOffsetX = (totalW - geometry.frameWidth) / 2;

  return {
    boardOffsetX,
    hasBorder: true,
    raisedEdgesOffsetX: -boardOffsetX,
    totalHeight: geometry.frameHeight,
    totalWidth: totalW,
  };
};
