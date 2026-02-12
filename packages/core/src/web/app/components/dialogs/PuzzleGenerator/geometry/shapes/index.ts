/**
 * Shape registry and backward-compatible API.
 *
 * The SHAPE_REGISTRY provides compile-time exhaustiveness — adding a new ShapeType
 * literal without a corresponding entry is a type error.
 *
 * The exported functions preserve the exact signatures used by existing callers,
 * so no changes are needed in puzzleGeometry.ts, puzzleGenerator.ts, etc.
 */

import type { ShapeType } from '../../types';

import { circleShape } from './circle';
import { heartShape } from './heart';
import { hexagonShape } from './hexagon';
import { rectangleShape } from './rectangle';
import type { BorderOptions, MetadataInput, RaisedEdgesOptions, ShapeGenerator, ShapeOptions } from './types';

/**
 * Shape registry. Typed as Record<ShapeType, ShapeGenerator> so TypeScript
 * errors if a ShapeType literal is added without a corresponding entry.
 */
const SHAPE_REGISTRY: Record<ShapeType, ShapeGenerator> = {
  circle: circleShape,
  heart: heartShape,
  hexagon: hexagonShape,
  rectangle: rectangleShape,
};

/** Get a shape implementation by type. */
export const getShape = (type: ShapeType): ShapeGenerator => SHAPE_REGISTRY[type];

// ── Backward-compatible dispatcher functions ────────────────────────────────
// These preserve the exact signatures that callers use today.

export const generateShapePath = (shapeType: ShapeType, options: ShapeOptions): string =>
  getShape(shapeType).generatePath(options);

export const generateBorderPath = (shapeType: ShapeType, options: BorderOptions): string =>
  getShape(shapeType).generateBorderPath(options);

/**
 * Generate a frame/raised edges path with inner cutout.
 * This is shape-agnostic composition logic, so it lives here rather than in the interface.
 */
export const generateRaisedEdgesPath = (shapeType: ShapeType, options: RaisedEdgesOptions): string => {
  const { innerCornerRadius, ...borderOpts } = options;
  const { cornerRadius = 0, height, width, ...rest } = borderOpts;

  const outerPath = generateBorderPath(shapeType, { ...borderOpts, cornerRadius });
  const innerPath = generateShapePath(shapeType, {
    ...rest,
    cornerRadius: innerCornerRadius ?? cornerRadius,
    height,
    width,
  });

  return `${outerPath} ${innerPath}`;
};

export const isPointInShape = (
  x: number,
  y: number,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius = 0,
  centerYOffset = 0,
): boolean => getShape(shapeType).isPointInside(x, y, width, height, cornerRadius, centerYOffset);

export const drawShapeClipPath = (
  ctx: CanvasRenderingContext2D,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius = 0,
  centerYOffset = 0,
): void => {
  getShape(shapeType).drawClipPath(ctx, width, height, cornerRadius, centerYOffset);
};

export const getShapeMetadata = (shapeType: ShapeType, state: MetadataInput) => getShape(shapeType).getMetadata(state);

// Re-export types for convenience
export type { BorderOptions, MetadataInput, RaisedEdgesOptions, ShapeGenerator, ShapeOptions } from './types';
