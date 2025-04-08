import { useCallback, useState } from 'react';

import paper from 'paper';
import { match, P } from 'ts-pattern';

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
 * @property isDraggable whether the stage is draggable
 * @property handleWheel handle wheel event
 * @property handleZoom handle zoom event
 * @property handleZoomByScale handle zoom by scale event
 */
type ReturnType = {
  handleWheel: (event: WheelEvent) => void;
  handleZoom: (scale: number, event?: MouseEvent) => void;
  handleZoomByScale: (scaleBy: number, event?: MouseEvent) => void;
  isDraggable: boolean;
  isDragging: boolean;
};

/**
 * usePaperCanvas
 * hooks that contains paperjs view operations(mainly for zooming and panning)
 * @param maxScale max scale of the canvas
 * @param minScale min scale of the canvas
 * @param onScaleChanged callback when scale changed
 * @returns ReturnType
 */
export const usePaperCanvas = ({
  maxScale = 20,
  minScale = 0.01,
  onScaleChanged = () => {},
}: Options = {}): ReturnType => {
  const [isDraggable, setIsDraggable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useKeyDown({
    keyDown: useCallback(() => setIsDraggable(true), []),
    keyUp: useCallback(() => setIsDraggable(false), []),
    predicate: useCallback(({ key }) => key === ' ', []),
  });
  useMouseDown({
    mouseDown: useCallback(() => {
      setIsDraggable(true);
      setIsDragging(true);
    }, []),
    mouseUp: useCallback(() => {
      setIsDraggable(false);
      setIsDragging(false);
    }, []),
    predicate: useCallback(({ button }) => button === 1, []),
  });
  useMouseDown({
    mouseDown: useCallback(() => setIsDragging(isDraggable), [isDraggable]),
    mouseUp: useCallback(() => setIsDragging(false), []),
    predicate: useCallback(({ button }) => button === 0, []),
  });

  const handleMove = useCallback(({ deltaX, deltaY }: WheelEvent) => {
    paper.view.translate(new paper.Point(-deltaX, -deltaY));
  }, []);

  const handleZoom = useCallback(
    (scale: number, event?: MouseEvent) => {
      // set target position to center of the view if no mouse event is provided
      // otherwise, set target position to the mouse position
      // which make user feel like zooming in/out at the mouse position
      const targetPosition = event
        ? paper.project.view.getEventPoint(event as unknown as paper.Event)
        : new paper.Point(paper.view.center);
      const boundedScale = Math.min(maxScale, Math.max(minScale, scale));

      paper.view.zoom = boundedScale;
      paper.view.center.set(targetPosition);

      onScaleChanged(boundedScale);
    },
    [maxScale, minScale, onScaleChanged],
  );

  const handleZoomByScale = useCallback(
    (scaleBy: number, event?: MouseEvent) => handleZoom(paper.view.zoom * scaleBy, event),
    [handleZoom],
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      // Unable to preventDefault inside passive event listener invocation.
      // event.preventDefault();

      match(event)
        .with({ ctrlKey: true, deltaY: P.number.lt(0) }, () => handleZoomByScale(1.02, event))
        .with({ ctrlKey: true, deltaY: P.number.gte(0) }, () => handleZoomByScale(0.98, event))
        .otherwise(() => handleMove(event));
    },
    [handleMove, handleZoomByScale],
  );

  return {
    handleWheel,
    handleZoom,
    handleZoomByScale,
    isDraggable,
    isDragging,
  };
};
