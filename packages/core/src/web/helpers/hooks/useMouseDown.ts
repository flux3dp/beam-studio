import { useEffect } from 'react';

interface Props {
  element?: HTMLElement;
  mouseDown?: () => void;
  mouseUp?: () => void;
  predicate: (e: MouseEvent) => boolean;
  shouldPreventDefault?: boolean;
}

export const useMouseDown = ({
  element = document as unknown as HTMLElement,
  mouseDown,
  mouseUp,
  predicate,
  shouldPreventDefault = true,
}: Props): void => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (predicate(e)) {
        if (shouldPreventDefault) e.preventDefault();

        mouseDown?.();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (predicate(e)) mouseUp?.();
    };

    if (mouseDown) element.addEventListener('mousedown', handleMouseDown);

    if (mouseUp) element.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (mouseDown) element.removeEventListener('mousedown', handleMouseDown);

      if (mouseUp) element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [element, shouldPreventDefault, mouseDown, mouseUp, predicate]);
};
