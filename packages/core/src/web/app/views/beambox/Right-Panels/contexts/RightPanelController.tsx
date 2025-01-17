import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { PanelType } from 'app/constants/right-panel-types';

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');

const setDisplayLayer = (val: boolean): void => {
  rightPanelEventEmitter.emit('DISPLAY_LAYER', val);
};

const updatePathEditPanel = (): void => {
  rightPanelEventEmitter.emit('UPDATE_PATH_EDIT_PANEL');
};

const setPanelType = (val: PanelType): void => {
  rightPanelEventEmitter.emit('SET_PANEL_TYPE', val);
};

export default {
  setDisplayLayer,
  setPanelType,
  updatePathEditPanel,
};
