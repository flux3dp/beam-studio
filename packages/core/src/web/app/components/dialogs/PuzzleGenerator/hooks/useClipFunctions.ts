import { useMemo } from 'react';

import type Konva from 'konva';

import { drawShapeClipPath } from '../geometry';
import type { PuzzleGeometry, ShapeMetadata, ShapeType } from '../types';

/** Wraps drawShapeClipPath to produce a Konva-compatible clipFunc, avoiding repeated `as unknown` casts. */
const createClipFunc =
  (shapeType: ShapeType, width: number, height: number, cornerRadius: number, centerYOffset: number): ((ctx: Konva.Context) => void) =>
  (ctx: Konva.Context) =>
    drawShapeClipPath(ctx as unknown as CanvasRenderingContext2D, shapeType, width, height, cornerRadius, centerYOffset);

const useClipFunctions = (shapeType: ShapeType, geometry: PuzzleGeometry, meta: ShapeMetadata, bleed: number) => {
  // boundaryClip is optional - undefined for shapes that fill their bounding box (e.g., rectangles)
  const boundaryClip = useMemo(() => {
    if (meta.fillsBoundingBox) return undefined;

    return createClipFunc(shapeType, geometry.layout.width, meta.boundaryHeight, meta.boundaryCornerRadius, meta.centerYOffset);
  }, [meta.fillsBoundingBox, meta.boundaryCornerRadius, meta.boundaryHeight, meta.centerYOffset, shapeType, geometry.layout.width]);

  // imageClip is always defined - images must be clipped to prevent overflow
  // When bleed > 0, clip to expanded boundary; otherwise clip to exact boundary
  const imageClip = useMemo(
    () =>
      createClipFunc(
        shapeType,
        geometry.layout.width + bleed * 2,
        meta.boundaryHeight + bleed * 2,
        meta.boundaryCornerRadius,
        meta.centerYOffset,
      ),
    [bleed, shapeType, geometry.layout.width, meta.boundaryHeight, meta.boundaryCornerRadius, meta.centerYOffset],
  );

  return { boundaryClip, imageClip };
};

export default useClipFunctions;
