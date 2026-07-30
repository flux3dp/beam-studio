import type { Modifier } from '@dnd-kit/core';

/**
 * dnd-kit modifier that keeps the dragged item inside its container's rect.
 *
 * Shared by every sortable grid/list in the app (content library, file thumbnails, ...).
 */
export const restrictToParent: Modifier = ({ activeNodeRect, containerNodeRect, transform }) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  let { x, y } = transform;

  // left edge
  if (activeNodeRect.left + x < containerNodeRect.left) {
    x = containerNodeRect.left - activeNodeRect.left;
  }

  // right edge
  if (activeNodeRect.right + x > containerNodeRect.right) {
    x = containerNodeRect.right - activeNodeRect.right;
  }

  // top edge
  if (activeNodeRect.top + y < containerNodeRect.top) {
    y = containerNodeRect.top - activeNodeRect.top;
  }

  // bottom edge
  if (activeNodeRect.bottom + y > containerNodeRect.bottom) {
    y = containerNodeRect.bottom - activeNodeRect.bottom;
  }

  return {
    ...transform,
    x,
    y,
  };
};
