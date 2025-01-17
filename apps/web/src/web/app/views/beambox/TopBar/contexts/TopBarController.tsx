import BeamboxGlobalInteraction from 'app/actions/beambox/beambox-global-interaction';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { IDeviceInfo } from 'interfaces/IDevice';

const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');

const setElement = (elem: Element | null): void => {
  if (!elem) {
    BeamboxGlobalInteraction.onObjectBlur();
  } else {
    BeamboxGlobalInteraction.onObjectBlur();
    BeamboxGlobalInteraction.onObjectFocus([elem]);
  }

  topBarEventEmitter.emit('SET_ELEMENT', elem);
};

const updateTitle = (title: string, isCloudFile: boolean): void => {
  topBarEventEmitter.emit('UPDATE_TITLE', title, isCloudFile);
};

const onTitleChange = (handler: (title: string, isCloudFile: boolean) => void): void => {
  topBarEventEmitter.on('UPDATE_TITLE', handler);
};

const offTitleChange = (handler: (title: string, isCloudFile: boolean) => void): void => {
  topBarEventEmitter.removeListener('UPDATE_TITLE', handler);
};

const setHasUnsavedChange = (hasUnsavedChange: boolean): void => {
  topBarEventEmitter.emit('SET_HAS_UNSAVED_CHANGE', hasUnsavedChange);
};

const getTopBarPreviewMode = (): boolean => {
  const response = {
    isPreviewMode: false,
  };
  topBarEventEmitter.emit('GET_TOP_BAR_PREVIEW_MODE', response);
  return response.isPreviewMode;
};

const getSelectedDevice = (): IDeviceInfo | null => {
  const response = {
    selectedDevice: null,
  };
  topBarEventEmitter.emit('GET_SELECTED_DEVICE', response);
  return response.selectedDevice;
};

const setSelectedDevice = (device: IDeviceInfo): void => {
  topBarEventEmitter.emit('SET_SELECTED_DEVICE', device);
};

export default {
  setElement,
  updateTitle,
  setHasUnsavedChange,
  getTopBarPreviewMode,
  getSelectedDevice,
  setSelectedDevice,
  onTitleChange,
  offTitleChange,
};
