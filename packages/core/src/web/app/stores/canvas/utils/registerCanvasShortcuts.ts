import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import { CanvasMode } from '@core/app/constants/canvasMode';
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

const shortcutsMap: Array<{ callback: () => void; condition?: ConditionChecker; keys: string[] }> = [
  { callback: () => setMouseMode('line'), keys: ['\\'] },
  { callback: () => setMouseMode('ellipse'), keys: ['c'] },
  { callback: () => setMouseMode('rect'), keys: ['m'] },
  { callback: () => setMouseMode('path'), keys: ['p'] },
  { callback: () => setMouseMode('text'), keys: ['t'] },
  { callback: () => setMouseMode('select'), keys: ['v'] },
  { callback: () => useCanvasStore.getState().toggleDrawerMode('element-panel'), keys: ['e'] },
  { callback: () => FnWrapper.importImage(), keys: ['i'] },
];

export const registerCanvasShortcuts = () => {
  const unsubscribes = Array.of<() => void>();

  shortcutsMap.forEach(({ callback, condition, keys }) => {
    const handler = () => {
      if (checkPageAndMode(condition)) callback();
    };

    unsubscribes.push(shortcuts.on(keys, handler));
  });

  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
};
