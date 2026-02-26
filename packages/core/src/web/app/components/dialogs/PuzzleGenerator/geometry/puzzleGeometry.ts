/**
 * Unified Puzzle Geometry Service
 *
 * Single source of truth for all puzzle geometry calculations.
 * Used by both Preview.tsx (rendering) and svgExport.ts (export).
 *
 * Caches visibility and merge group calculations for shapes that don't fill
 * their bounding box. The cache is invalidated when geometry-affecting fields
 * change (see hashGeometryState for the full list of cache keys).
 */

import { LAYER_GAP } from '../constants';
import type { ClipContext, MergeGroup, PieceVisibility, PuzzleGeometry, PuzzleState, ShapeType } from '../types';

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

  // Generate boundary path first — needed for both rendering and edge trimming
  const boundaryPath = generateShapePath(shapeType, {
    centerY: meta.centerYOffset,
    cornerRadius: meta.boundaryCornerRadius,
    height: meta.boundaryHeight,
    width: layout.width,
  });

  const edges = generatePuzzleEdges(state, layout, mergeGroups, boundaryPath, visibility);

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

  const borderExpansion = state.border.enabled ? state.border.width * 2 : 0;
  const bleedExpansion = state.image.enabled && state.image.dataUrl !== null ? state.image.bleed * 2 : 0;
  const frameExpansion = Math.max(borderExpansion, bleedExpansion);

  const frameWidth = layout.width + frameExpansion;
  const frameHeight = meta.boundaryHeight + frameExpansion;

  const clipContext: ClipContext = {
    centerYOffset: meta.centerYOffset,
    cornerRadius: meta.boundaryCornerRadius,
    height: meta.boundaryHeight,
    shapeType,
    width: layout.width,
  };

  return {
    boardBasePath,
    boundaryPath,
    clipContext,
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
 * Computes layout for SVG export with optional border side-by-side arrangement.
 *
 * When border is disabled:
 * - Single centered element with optional image bleed expansion
 *
 * When border is enabled:
 * - Two-part layout: board base on right, puzzle pieces + raised edges frame on left
 * - Separated by LAYER_GAP to prevent overlap during laser cutting
 * - raisedEdgesOffsetX is negative to shift left side leftward from canvas origin
 */
export const computeExportLayout = (geometry: PuzzleGeometry, borderEnabled: boolean) => {
  const hasFrameExpansion = geometry.frameWidth > geometry.layout.width;

  if (!borderEnabled) {
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
