import { useEffect } from 'react';

interface Props {
  predicate: (e: MouseEvent) => boolean;
  mouseDown?: () => void;
  mouseUp?: () => void;
}

/* eslint-disable import/prefer-default-export */
export const useMouseDown = ({ predicate, mouseDown, mouseUp }: Props): void => {
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

    if (mouseDown) document.addEventListener('mousedown', handleMouseDown);
    if (mouseUp) document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (mouseDown) document.removeEventListener('mousedown', handleMouseDown);
      if (mouseUp) document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseDown, mouseUp, predicate]);
};
