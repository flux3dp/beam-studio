import undoManager from '@core/app/svgedit/history/undoManager';

const LOCK_ATTR = 'data-lock';

/**
 * Whether an element is individually locked. Climbs ancestors up to (not including) its
 * layer group, so a locked group also locks its descendants.
 */
export const isElemLocked = (elem: Element | null): boolean => {
  return elem?.getAttribute(LOCK_ATTR) === 'true';
};

/**
 * Toggle an element's `data-lock` between 'true' and 'false' (a missing/empty value counts as
 * 'false'). Records an undoable change and returns the new locked state.
 */
export const setElemLock = (elem: Element): boolean => {
  const next = elem.getAttribute(LOCK_ATTR) !== 'true';

  undoManager.beginUndoableChange(LOCK_ATTR, [elem]);
  elem.setAttribute(LOCK_ATTR, next ? 'true' : 'false');

  const cmd = undoManager.finishUndoableChange();

  if (!cmd.isEmpty()) undoManager.addCommandToHistory(cmd);

  return next;
};
