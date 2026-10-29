/**
 * Keeps a click that ends a gizmo drag from reselecting.
 *
 * TransformControls listens to the canvas's own pointer events and stops none of them, so a drag
 * that starts on a handle lying over an object and ends with the pointer still over it is also a
 * DOM click on that object: r3f fires `onClick` on whatever was hit at pointer down and is hit again
 * at pointer up, with no distance threshold (its 2px threshold only guards `onPointerMissed`). The
 * rotation ring sits right over the selection, so turning several objects and letting go would
 * collapse the selection to the object under the pointer.
 *
 * The gizmo's `mouseUp` fires on pointer up, before the click, so marking the drag there is in time
 * for the click handler to skip it. The next pointer down clears the mark in case no click followed.
 */
let dragged = false;

/** The gizmo finished a drag that moved something; the click about to follow is not a selection. */
export const markGizmoDragged = (): void => {
  dragged = true;
};

/** A new gesture: whatever the last drag left behind no longer applies. */
export const resetGizmoDragged = (): void => {
  dragged = false;
};

/** Whether the click being handled ends a gizmo drag. Clears the mark, so each drag skips one click. */
export const consumeGizmoDragged = (): boolean => {
  const wasDragged = dragged;

  dragged = false;

  return wasDragged;
};
