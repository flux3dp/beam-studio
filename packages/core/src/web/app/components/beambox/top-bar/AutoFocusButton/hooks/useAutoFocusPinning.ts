import { useCallback, useEffect, useRef, useState } from 'react';

import { getEventPoint } from '@core/app/svgedit/interaction/mouse/utils/getEventPoint';
import shortcuts from '@core/helpers/shortcuts';

/**
 * Custom Hook: useAutoFocusPinning
 * Manages the UI and event listeners for the auto focus pinning mode.
 */
export const useAutoFocusPinning = (
  onPin: (coords: { x: number; y: number }) => Promise<void>,
  toggleAutoFocus: (forceState?: boolean) => void,
) => {
  const [isPinning, setIsPinning] = useState(false);
  const coordsDisplayRef = useRef<HTMLDivElement | null>(null);

  const stopPinning = useCallback(() => {
    setIsPinning(false);
  }, []);

  const startPinning = useCallback(() => {
    setIsPinning(true);
  }, []);

  useEffect(() => {
    const workarea = document.querySelector('#workarea') as HTMLElement;

    if (!workarea) return;

    // Cleanup function runs when isPinning becomes false or the component unmounts
    if (!isPinning) {
      workarea.style.cursor = 'default';

      if (coordsDisplayRef.current) {
        coordsDisplayRef.current.remove();
        coordsDisplayRef.current = null;
      }

      return;
    }

    workarea.style.cursor = 'url(img/auto-focus-cursor.svg) 16 12, cell';

    console.log(workarea.style.cursor);

    // Create the coordinate display tooltip
    if (!coordsDisplayRef.current) {
      const el = document.createElement('div');

      el.style.cssText = `
        position: fixed;
        background-color: rgba(0,0,0,0.75);
        color: white;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        pointer-events: none;
        font-family: sans-serif;
        z-index: 10001;
      `;
      document.body.appendChild(el);
      coordsDisplayRef.current = el;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const displayEl = coordsDisplayRef.current;

      if (!displayEl) return;

      // Position the tooltip near the cursor
      displayEl.style.left = `${e.clientX + 20}px`;
      displayEl.style.top = `${e.clientY + 20}px`;

      // Convert the event's screen coordinates to SVG coordinates
      const pt = getEventPoint(e);

      displayEl.textContent = `X: ${(pt.x / 10).toFixed(1)}, Y: ${(pt.y / 10).toFixed(1)}`;
    };

    const handleMouseClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pt = getEventPoint(e);

      await onPin(pt); // Execute the callback with the pinned coordinates

      console.log('pinned', pt);
      stopPinning();
    };

    // Add all event listeners
    workarea.addEventListener('mousemove', handleMouseMove);
    workarea.addEventListener('click', handleMouseClick, { capture: true });

    const unregister = shortcuts.on(
      ['Escape'],
      () => {
        stopPinning();
        toggleAutoFocus(false);
      },
      { isBlocking: true },
    );

    // Return a cleanup function to remove listeners
    return () => {
      workarea.removeEventListener('mousemove', handleMouseMove);
      workarea.removeEventListener('click', handleMouseClick, { capture: true });
      unregister();
      stopPinning(); // Ensure state is cleaned up
      // toggleAutoFocus(false);
    };
  }, [isPinning, onPin, stopPinning, toggleAutoFocus]);

  return { isPinning, startPinning, stopPinning };
};
