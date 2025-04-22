import { useEffect } from 'react';

interface Props {
  keyDown?: () => void;
  keyUp?: () => void;
  predicate: (e: KeyboardEvent) => boolean;
  shouldPreventDefault?: boolean;
}

export const useKeyDown = ({ keyDown, keyUp, predicate, shouldPreventDefault = true }: Props): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (predicate(e)) {
        if (shouldPreventDefault) e.preventDefault();

        keyDown?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (predicate(e)) keyUp?.();
    };

    if (keyDown) document.addEventListener('keydown', handleKeyDown);

    if (keyUp) document.addEventListener('keyup', handleKeyUp);

    return () => {
      if (keyDown) document.removeEventListener('keydown', handleKeyDown);

      if (keyUp) document.removeEventListener('keyup', handleKeyUp);
    };
  }, [shouldPreventDefault, keyDown, keyUp, predicate]);
};
