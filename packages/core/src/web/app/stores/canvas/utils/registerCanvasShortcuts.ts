import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import type { HashMapKey } from '@core/helpers/hashHelper';
import { isAtPage } from '@core/helpers/hashHelper';
import shortcuts from '@core/helpers/shortcuts';

import { useCanvasStore } from '../canvasStore';

import { setMouseMode } from './mouseMode';

type ConditionChecker = {
  targetMode?: CanvasMode;
  targetPage?: HashMapKey;
};

const checkPageAndMode = ({ targetMode = CanvasMode.Draw, targetPage = 'editor' }: ConditionChecker = {}) => {
  if (!isAtPage(targetPage)) return false;

  const { mode } = useCanvasStore.getState();

  return mode === targetMode;
};

/**
 * Inner engraving is not a CanvasMode, so it is checked on its own: the 2D drawing tools have no 3D
 * counterpart (DrawingToolButtonGroup hides their buttons) and would only leave the 3D canvas with
 * a crosshair cursor and nothing to draw.
 */
const shortcutsMap: Array<{
  callback: () => void;
  condition?: ConditionChecker;
  keys: string[];
  supportedIn3D?: boolean;
}> = [
  { callback: () => setMouseMode('line'), keys: ['\\'], supportedIn3D: false },
  { callback: () => setMouseMode('ellipse'), keys: ['c'], supportedIn3D: false },
  { callback: () => setMouseMode('rect'), keys: ['m'], supportedIn3D: false },
  { callback: () => setMouseMode('path'), keys: ['p'], supportedIn3D: false },
  { callback: () => setMouseMode('select'), keys: ['v'] },
  { callback: () => useCanvasStore.getState().toggleDrawerMode('element-panel'), keys: ['e'] },
  { callback: () => FnWrapper.importImage(), keys: ['i'] },
];

export const registerCanvasShortcuts = () => {
  const unsubscribes = Array.of<() => void>();

  shortcutsMap.forEach(({ callback, condition, keys, supportedIn3D = true }) => {
    const handler = () => {
      if (!supportedIn3D && isInnerEngravingActive()) return;

      if (checkPageAndMode(condition)) callback();
    };

    unsubscribes.push(shortcuts.on(keys, handler));
  });

  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
};
