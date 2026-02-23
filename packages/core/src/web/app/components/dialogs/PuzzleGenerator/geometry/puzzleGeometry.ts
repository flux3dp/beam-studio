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
 * 4. Caches expensive visibility/merge calculations when enabled
 */

import { LAYER_GAP } from '../constants';
import type { MergeGroup, PieceVisibility, PuzzleGeometry, PuzzleState, ShapeType } from '../types';

import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
} from './puzzleGenerator';
import { generateBorderPath, generateRaisedEdgesPath, generateShapePath, getShapeMetadata } from './shapes';

interface GeometryCache {
  mergeGroups: MergeGroup[];
  stateHash: string;
  visibility: PieceVisibility[];
}

let cache: GeometryCache | null = null;

const hashGeometryState = (state: PuzzleState, shapeType: ShapeType): string => {
  const { border, columns, orientation, pieceSize, rows, typeId } = state;
  const radius = 'radius' in state ? state.radius : 0;

  return `${typeId}-${shapeType}-${columns}x${rows}-${pieceSize}-${orientation}-${border.enabled}-${border.width}-${border.radius}-${radius}`;
};

const computeVisibilityAndMerges = (
  state: PuzzleState,
  shapeType: ShapeType,
  layout: ReturnType<typeof calculatePuzzleLayout>,
  meta: ReturnType<typeof getShapeMetadata>,
): { mergeGroups: MergeGroup[]; visibility: PieceVisibility[] } => {
  const visibility = calculateAllPieceVisibilities(
    state,
    shapeType,
    layout,
    meta.centerYOffset,
    meta.boundaryHeight,
    meta.boundaryCornerRadius,
  );
  const mergeGroups = calculateMergeGroups(visibility, state.rows, state.columns);

  return { mergeGroups, visibility };
};

/**
 * Computes all puzzle geometry in a single pass.
 * Caches visibility/merge calculations to avoid ~8,500 point-in-shape tests per recompute.
 */
export const computePuzzleGeometry = (state: PuzzleState, shapeType: ShapeType): PuzzleGeometry => {
  const layout = calculatePuzzleLayout(state);
  const meta = getShapeMetadata(shapeType, state);

  let visibility: PieceVisibility[];
  let mergeGroups: MergeGroup[];

  if (meta.fillsBoundingBox) {
    visibility = [];
    mergeGroups = [];
  } else {
    const stateHash = hashGeometryState(state, shapeType);

    if (cache?.stateHash === stateHash) {
      visibility = cache.visibility;
      mergeGroups = cache.mergeGroups;
    } else {
      const computed = computeVisibilityAndMerges(state, shapeType, layout, meta);

      visibility = computed.visibility;
      mergeGroups = computed.mergeGroups;
      cache = { mergeGroups, stateHash, visibility };
    }
  }

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
  // Calculate expansion from board base
  const borderExpansion = state.border.enabled ? state.border.width * 2 : 0;

  // Calculate expansion from image bleed (only when image is uploaded)
  const bleedExpansion = state.image.enabled && state.image.dataUrl !== null ? state.image.bleed * 2 : 0;

  // Use maximum of the two expansions (they don't stack)
  const frameExpansion = Math.max(borderExpansion, bleedExpansion);

  const frameWidth = layout.width + frameExpansion;
  const frameHeight = meta.boundaryHeight + frameExpansion;

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
  const hasFrameExpansion = geometry.frameWidth > geometry.layout.width;

  if (!borderEnabled) {
    // When bleed is active (but no board), use expanded frame dimensions
    // but don't create exploded layout
    return {
      boardOffsetX: 0,
      hasBorder: false,
      raisedEdgesOffsetX: 0,
      totalHeight: hasFrameExpansion ? geometry.frameHeight : geometry.layout.height,
      totalWidth: hasFrameExpansion ? geometry.frameWidth : geometry.layout.width,
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
