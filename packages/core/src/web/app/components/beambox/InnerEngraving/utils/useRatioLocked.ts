import { useEffect, useState } from 'react';

const RATIO_FIXED_ATTR = 'data-ratiofixed';

/** Read an object's aspect-ratio setting from its persisted SVG projection. */
export const getRatioLocked = (id: string): boolean =>
  document.getElementById(id)?.getAttribute(RATIO_FIXED_ATTR) === 'true';

/**
 * Keep 3D controls in sync with the projection's 2D ratio setting.
 *
 * The attribute is changed by svgedit's history-aware API, so observing it also covers undo/redo.
 */
const useRatioLocked = (id: string): boolean => {
  const [ratioLocked, setRatioLocked] = useState(() => getRatioLocked(id));

  useEffect(() => {
    const elem = document.getElementById(id);
    const refresh = () => setRatioLocked(getRatioLocked(id));

    refresh();

    if (!elem) return;

    const observer = new MutationObserver(refresh);

    observer.observe(elem, { attributeFilter: [RATIO_FIXED_ATTR], attributes: true });

    return () => observer.disconnect();
  }, [id]);

  return ratioLocked;
};

export default useRatioLocked;
