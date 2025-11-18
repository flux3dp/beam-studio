import { useCallback, useRef } from 'react';

type LongPressEvent = React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>;

interface UseLongPressOptions {
  onClick?: (e: LongPressEvent) => void;
  onLongPress?: (e: LongPressEvent) => void;
  threshold?: number; // Long press duration in ms
}

/**
 * useLongPress hook for React (TypeScript)
 *
 * Detects short vs. long presses on a button or any interactive element.
 * Supports both mouse and touch events.
 */
export function useLongPress({ onClick, onLongPress, threshold = 500 }: UseLongPressOptions) {
  const timerRef = useRef<null | number>(null);
  const longPressedRef = useRef(false);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (e: LongPressEvent) => {
      e.persist?.();
      targetRef.current = e.target;
      longPressedRef.current = false;

      timerRef.current = window.setTimeout(() => {
        onLongPress?.(e);
        longPressedRef.current = true;
      }, threshold);
    },
    [onLongPress, threshold],
  );

  const clear = useCallback(
    (e: LongPressEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Fire short click if not long-pressed
      if (!longPressedRef.current && onClick && e.target === targetRef.current) {
        onClick(e);
      }
    },
    [onClick],
  );

  if (!onLongPress) return { onClick };

  return {
    onMouseDown: start,
    onMouseLeave: clear,
    onMouseUp: clear,
    onTouchEnd: clear,
    onTouchStart: start,
  };
}
