import { useEffect } from 'react';

interface Props {
  keyDown?: () => void;
  keyUp?: () => void;
  predicate: (e: KeyboardEvent) => boolean;
}

export const useKeyDown = ({ keyDown, keyUp, predicate }: Props): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (predicate(e)) {
        e.preventDefault();
        keyDown?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (predicate(e)) {
        keyUp?.();
      }
    };

    if (keyDown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    if (keyUp) {
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (keyDown) {
        document.removeEventListener('keydown', handleKeyDown);
      }

      if (keyUp) {
        document.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [keyDown, keyUp, predicate]);
};
