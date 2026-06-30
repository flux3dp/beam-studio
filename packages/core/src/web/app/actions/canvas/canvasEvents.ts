import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export const setSelectedElement = (elem: Element | null): void => {
  BeamboxGlobalInteraction.onObjectBlur();
  useSelectedElementStore.getState().setSelectedElement(elem as null | SVGElement);

  // Note: onObjectFocus should be called after setSelectedElement to get correct store values
  if (elem) BeamboxGlobalInteraction.onObjectFocus([elem]);
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
  setPathEditing,
  setSelectedElement,
  updateContext,
};
