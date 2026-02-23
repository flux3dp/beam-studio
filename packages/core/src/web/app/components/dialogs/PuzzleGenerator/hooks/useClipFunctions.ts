import { useMemo } from 'react';

import type Konva from 'konva';

import { drawShapeClipPath } from '../geometry';
import type { ClipContext, PuzzleGeometry, ShapeMetadata } from '../types';

const createClipFunc =
  (clipContext: ClipContext): ((ctx: Konva.Context) => void) =>
  (ctx: Konva.Context) =>
    drawShapeClipPath(ctx as unknown as CanvasRenderingContext2D, clipContext);

const useClipFunctions = (geometry: PuzzleGeometry, meta: ShapeMetadata, bleed: number) => {
  const boundaryClip = useMemo(() => {
    if (meta.fillsBoundingBox) return undefined;

    return createClipFunc(geometry.clipContext);
  }, [meta.fillsBoundingBox, geometry.clipContext]);

  const imageClip = useMemo(() => {
    const expandedContext: ClipContext = {
      ...geometry.clipContext,
      height: geometry.clipContext.height + bleed * 2,
      width: geometry.clipContext.width + bleed * 2,
    };

    return createClipFunc(expandedContext);
  }, [bleed, geometry.clipContext]);

  return { boundaryClip, imageClip };
};

export default useClipFunctions;
