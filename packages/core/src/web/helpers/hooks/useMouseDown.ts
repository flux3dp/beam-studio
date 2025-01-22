import { useEffect } from 'react';

interface Props {
  mouseDown?: () => void;
  mouseUp?: () => void;
  predicate: (e: MouseEvent) => boolean;
}

export const useMouseDown = ({ mouseDown, mouseUp, predicate }: Props): void => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (predicate(e)) {
        e.preventDefault();
        mouseDown();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (predicate(e)) {
        mouseUp();
      }
    };

    if (mouseDown) {
      document.addEventListener('mousedown', handleMouseDown);
    }

    if (mouseUp) {
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (mouseDown) {
        document.removeEventListener('mousedown', handleMouseDown);
      }

      if (mouseUp) {
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [mouseDown, mouseUp, predicate]);
};
