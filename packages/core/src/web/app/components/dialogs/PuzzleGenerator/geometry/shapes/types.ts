/**
 * Shape module interface and shared option types.
 *
 * Each shape (circle, heart, hexagon, rectangle) implements `ShapeGenerator`.
 * Shape-agnostic composition (e.g., raised edges) lives in the registry (index.ts).
 */

import type { ShapeMetadata } from '../../types';

export interface ShapeOptions {
  /** Center X coordinate (default: 0) */
  centerX?: number;
  /** Center Y coordinate (default: 0) */
  centerY?: number;
  /** Corner radius for rectangle, bottom point sharpness for heart (0-50) */
  cornerRadius?: number;
  /** Total height of the shape */
  height: number;
  /** Total width of the shape */
  width: number;
}

export interface BorderOptions extends ShapeOptions {
  borderWidth: number;
}

export interface RaisedEdgesOptions extends BorderOptions {
  /** Corner radius for the inner cutout (defaults to cornerRadius if not specified) */
  innerCornerRadius?: number;
}

/** Narrow input for metadata resolution — only the fields getMetadata actually reads. */
export interface MetadataInput {
  border: { radius: number };
  pieceSize: number;
  radius?: number;
  rows: number;
}

/**
 * Contract for a shape implementation.
 * Each shape provides one of these to the SHAPE_REGISTRY.
 *
 * Adding a new shape:
 * 1. Add literal to `ShapeType` in types.ts
 * 2. Create a new file implementing `ShapeGenerator`
 * 3. Add to `SHAPE_REGISTRY` in shapes/index.ts (compiler-enforced via `Record<ShapeType, ...>`)
 */
export interface ShapeGenerator {
  /**
   * Draw the shape boundary on a Canvas 2D context (for Konva clipFunc and image export clipping).
   * Must call ctx.beginPath() and ctx.closePath().
   */
  drawClipPath(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cornerRadius?: number,
    centerYOffset?: number,
  ): void;

  /**
   * Generate SVG path for the border (expanded shape for board base).
   * Most shapes expand dimensions by borderWidth. Heart uses Bézier offset.
   */
  generateBorderPath(options: BorderOptions): string;

  /** Generate SVG path for the shape boundary. */
  generatePath(options: ShapeOptions): string;

  /** Resolve shape-specific metadata from state fields. */
  getMetadata(input: MetadataInput): ShapeMetadata;

  /**
   * Point-in-shape test for visibility calculations.
   * All coordinates are in centered-at-origin space.
   */
  isPointInside(
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius?: number,
    centerYOffset?: number,
  ): boolean;
}

/**
 * Default border path generator for shapes that simply expand dimensions.
 * Heart shape uses custom Bézier offset instead.
 */
export const createExpandedBorderPath = (
  generatePath: (options: ShapeOptions) => string,
  options: BorderOptions,
): string => {
  const { borderWidth, height, width, ...rest } = options;

  return generatePath({
    ...rest,
    height: height + borderWidth * 2,
    width: width + borderWidth * 2,
  });
};
