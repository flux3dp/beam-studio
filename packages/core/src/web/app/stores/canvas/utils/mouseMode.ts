import { match } from 'ts-pattern';

import { clear as clearPathActions, finishPath } from '@core/app/svgedit/operations/pathActions';
import textActions from '@core/app/svgedit/text/textactions';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

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

  const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

  match(mode)
    .with('select', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor'))
    .with('text', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Text'))
    .with('line', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Line'))
    .with('rect', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Rectangle'))
    .with('ellipse', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Ellipse'))
    .with('polygon', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Polygon'))
    .with('path', () => drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Pen'))
    .otherwise(() => {});
};
