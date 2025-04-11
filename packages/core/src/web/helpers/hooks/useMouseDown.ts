import { useEffect } from 'react';

interface Props {
  element?: HTMLElement;
  isPreventDefault?: boolean;
  mouseDown?: () => void;
  mouseUp?: () => void;
  predicate: (e: MouseEvent) => boolean;
}

export const useMouseDown = ({
  element = document as unknown as HTMLElement,
  isPreventDefault = true,
  mouseDown,
  mouseUp,
  predicate,
}: Props): void => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (predicate(e)) {
        if (isPreventDefault) e.preventDefault();

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
  }, [element, isPreventDefault, mouseDown, mouseUp, predicate]);
};
