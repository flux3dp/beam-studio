import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export const setSelectedElement = (elem: Element | null): void => {
  if (!elem) {
    BeamboxGlobalInteraction.onObjectBlur();
  } else {
    BeamboxGlobalInteraction.onObjectBlur();
    BeamboxGlobalInteraction.onObjectFocus([elem]);
  }

  canvasEventEmitter.emit('SET_SELECTED_ELEMENT', elem);
};

export const addImage = (): void => {
  canvasEventEmitter.emit('ADD_IMAGE');
};

export const addLine = (line: SVGLineElement): void => {
  canvasEventEmitter.emit('addLine', line);
};

export const addPath = (path?: SVGPathElement): void => {
  canvasEventEmitter.emit('addPath', path);
};

const setColorPreviewing = (val: boolean): void => {
  canvasEventEmitter.emit('SET_COLOR_PREVIEWING', val);
};

const setPathEditing = (val: boolean): void => {
  canvasEventEmitter.emit('SET_PATH_EDITING', val);
};

const updateContext = (): void => {
  canvasEventEmitter.emit('UPDATE_CONTEXT');
};

export default {
  addImage,
  addLine,
  addPath,
  setColorPreviewing,
  setPathEditing,
  setSelectedElement,
  updateContext,
};
