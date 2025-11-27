import { match } from 'ts-pattern';

import curveSelectUrl from '@core/app/icons/left-panel/curve-select.svg?url';
import { clear as clearPathActions, finishPath } from '@core/app/svgedit/operations/pathActions';
import textActions from '@core/app/svgedit/text/textactions';

import type { CanvasMouseMode } from '../canvasStore';
import { useCanvasStore } from '../canvasStore';

// syntactic sugar to get/set mouse mode
export const getMouseMode = (): CanvasMouseMode => {
  return useCanvasStore.getState().mouseMode;
};

export const setMouseMode = (mode: CanvasMouseMode) => {
  const currentMode = getMouseMode();

  if (currentMode === mode) return;

  if (currentMode === 'path') {
    finishPath();
    clearPathActions();
  }

  useCanvasStore.setState({ mouseMode: mode });

  if (currentMode === 'textedit') textActions.clear();
};

export const setCursor = (cursor: string, objectsCursor?: string) => {
  const workarea = document.getElementById('workarea');
  const svgEditor = document.getElementById('svg_editor');
  const layers = svgEditor?.getElementsByTagName('g');

  if (workarea) workarea.style.cursor = cursor;

  if (layers) {
    Array.from(layers).forEach((layer) => {
      if (layer.classList.contains('lock')) layer.style.cursor = cursor;
      else layer.style.cursor = objectsCursor || cursor;
    });
  }
};

export const setCursorAccordingToMouseMode = (mode?: CanvasMouseMode) => {
  const mouseMode = mode ?? getMouseMode();

  match(mouseMode)
    .with('select', () => setCursor('auto', 'move'))
    .with('pre_preview', 'preview', () => setCursor('url(img/camera-cursor.svg) 9 12, cell'))
    .with('auto-focus', () => setCursor('url(img/auto-focus-cursor.svg) 16 12, cell'))
    .with('curve-engraving', () => setCursor(`url(${curveSelectUrl}) 25 7, cell`))
    .with('rotate', () => setCursor('url(core-img/rotate.png) 12 12, auto'))
    .with('pathedit', 'textedit', () => setCursor('auto'))
    .with('line', 'ellipse', 'rect', 'polygon', 'path', () => setCursor('crosshair'))
    .with('text', () => setCursor('text'))
    .otherwise(() => setCursor('auto'));
};

useCanvasStore.subscribe(
  (state) => state.mouseMode,
  (mouseMode) => {
    setCursorAccordingToMouseMode(mouseMode);
  },
);
