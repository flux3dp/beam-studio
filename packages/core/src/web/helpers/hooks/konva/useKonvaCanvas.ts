import type { MutableRefObject } from 'react';
import { useCallback, useState } from 'react';

import type Konva from 'konva';

import { useKeyDown } from '../useKeyDown';
import { useMouseDown } from '../useMouseDown';

interface Options {
  maxScale?: number;
  minScale?: number;
  onScaleChanged?: (scale: number) => void;
}

/**
 * ReturnType
 * @property isDragging whether the stage is dragging
 * @property handleWheel handle wheel event
 * @property handleZoom handle zoom event
 */
interface ReturnType {
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleZoom: (scale: number, isPointer?: boolean) => void;
  handleZoomByScale: (scaleBy: number, isPointer?: boolean) => void;
  isDragging: boolean;
}

/**
 * useKonvaCanvas
 * hook that make konva stage behave like a canvas (mainly for zooming and panning)
 * @param stageRef ref of the konva stage
 * @param maxScale max scale of the stage
 * @param minScale min scale of the stage
 * @param onScaleChanged callback when scale changed
 * @returns ReturnType
 */
const useKonvaCanvas = (
  stageRef: MutableRefObject<Konva.Stage | null>,
  { maxScale = 20, minScale = 0.01, onScaleChanged }: Options = {},
): ReturnType => {
  const [isDragging, setIsDragging] = useState(false);

  useKeyDown({
    keyDown: useCallback(() => setIsDragging(true), []),
    keyUp: useCallback(() => setIsDragging(false), []),
    predicate: useCallback(({ key }) => key === ' ', []),
  });
  useMouseDown({
    mouseDown: useCallback(() => {
      setIsDragging(true);
      // start drag directly
      stageRef.current?.startDrag();
      // eslint-disable-next-line hooks/exhaustive-deps
    }, []),
    mouseUp: useCallback(() => setIsDragging(false), []),
    predicate: useCallback(({ button }) => button === 1, []),
  });

  const handleMove = useCallback(
    ({ evt: { deltaX, deltaY } }: Konva.KonvaEventObject<WheelEvent>) => {
      const stage = stageRef.current;

      if (!stage) return;

      const { x, y } = stage.position();

      stage.position({ x: x - deltaX, y: y - deltaY });
      stage.batchDraw();
    },
    // eslint-disable-next-line hooks/exhaustive-deps
    [],
  );
  const handleZoom = useCallback(
    (scale: number, isPointer = false) => {
      const stage = stageRef.current;

      if (!stage) return;

      const oldScale = stage.scaleX();
      const targetPosition = isPointer ? stage.getPointerPosition() : { x: stage.width() / 2, y: stage.height() / 2 };

      if (!targetPosition) {
        return;
      }

      const mousePointTo = {
        x: (targetPosition.x - stage.x()) / oldScale,
        y: (targetPosition.y - stage.y()) / oldScale,
      };

      const boundedScale = Math.min(maxScale, Math.max(minScale, scale));
      const x = -(mousePointTo.x - targetPosition.x / boundedScale) * boundedScale;
      const y = -(mousePointTo.y - targetPosition.y / boundedScale) * boundedScale;
      const pos = { x, y };

      onScaleChanged?.(boundedScale);

      stage.scale({ x: boundedScale, y: boundedScale });
      stage.position(pos);
      stage.batchDraw();
    },
    // eslint-disable-next-line hooks/exhaustive-deps
    [onScaleChanged, maxScale, minScale],
  );

  const handleZoomByScale = useCallback(
    (scaleBy: number, isPointer = false) => {
      const stage = stageRef.current;

      if (!stage) return;

      const scale = stage.scaleX();

      handleZoom(scale * scaleBy, isPointer);
    },
    // eslint-disable-next-line hooks/exhaustive-deps
    [handleZoom],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      if (e.evt.ctrlKey) {
        handleZoomByScale(e.evt.deltaY < 0 ? 1.02 : 0.98, true);
      } else {
        handleMove(e);
      }
    },
    [handleMove, handleZoomByScale],
  );

  return {
    handleWheel,
    handleZoom,
    handleZoomByScale,
    isDragging,
  };
};

export default useKonvaCanvas;
