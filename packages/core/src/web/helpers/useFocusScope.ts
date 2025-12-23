import { type RefObject, useCallback, useEffect, useRef } from 'react';

import shortcuts from '@core/helpers/shortcuts';

/**
 * A hook that manages shortcut scopes based on focus.
 * When focus enters the container, a new shortcut scope is entered.
 * When focus leaves entirely, the scope is exited.
 */
export const useFocusScope = (containerRef: RefObject<HTMLElement | null>) => {
  // Store the exit function returned by shortcuts.enterScope()
  const exitScopeRef = useRef<(() => void) | null>(null);

  const isInsideContainer = useCallback(
    (element: Node | null): boolean => {
      if (!element) return false;

      return containerRef.current?.contains(element) ?? false;
    },
    [containerRef],
  );

  const enterScope = useCallback(() => {
    if (!exitScopeRef.current) {
      exitScopeRef.current = shortcuts.enterScope();
    }
  }, []);

  const exitScope = useCallback(() => {
    exitScopeRef.current?.();
    exitScopeRef.current = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleFocusIn = () => enterScope();

    const handleFocusOut = (e: FocusEvent) => {
      const newFocusTarget = e.relatedTarget as Node | null;

      // Only exit scope if focus moved explicitly outside the container
      if (!isInsideContainer(newFocusTarget)) {
        exitScope();
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
      exitScope();
    };
  }, [containerRef, enterScope, exitScope, isInsideContainer]);

  return {
    /** Manually enter scope (useful for click handlers on non-focusable elements) */
    enterScope,
    /** Manually exit scope */
    exitScope,
    /** Check if an element is inside the target container */
    isInsideContainer,
  };
};
