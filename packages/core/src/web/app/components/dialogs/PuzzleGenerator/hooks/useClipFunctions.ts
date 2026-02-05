import { useMemo } from 'react';

import type Konva from 'konva';

import { drawShapeClipPath, type PuzzleGeometry, type ShapeMetadata } from '../geometry';
import type { ShapeType } from '../types';

/** Wraps drawShapeClipPath to produce a Konva-compatible clipFunc, avoiding repeated `as unknown` casts. */
const createClipFunc =
  (shapeType: ShapeType, width: number, height: number, cornerRadius: number): ((ctx: Konva.Context) => void) =>
  (ctx: Konva.Context) =>
    drawShapeClipPath(ctx as unknown as CanvasRenderingContext2D, shapeType, width, height, cornerRadius);

const useClipFunctions = (shapeType: ShapeType, geometry: PuzzleGeometry, meta: ShapeMetadata, bleed: number) => {
  const boundaryClip = useMemo(() => {
    if (meta.fillsBoundingBox) return undefined;

    return createClipFunc(shapeType, geometry.layout.width, geometry.layout.height, meta.boundaryCornerRadius);
  }, [meta.fillsBoundingBox, meta.boundaryCornerRadius, shapeType, geometry.layout.width, geometry.layout.height]);

  const imageClip = useMemo(() => {
    if (bleed > 0) {
      return createClipFunc(
        shapeType,
        geometry.layout.width + bleed * 2,
        geometry.layout.height + bleed * 2,
        meta.boundaryCornerRadius,
      );
    }

    return boundaryClip;
  }, [bleed, boundaryClip, shapeType, geometry.layout.width, geometry.layout.height, meta.boundaryCornerRadius]);

  return { boundaryClip, imageClip };
};

export default useClipFunctions;
