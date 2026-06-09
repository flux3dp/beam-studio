import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');

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

const getSelectedDevice = (): IDeviceInfo | null => {
  const response = { selectedDevice: null };

  topBarEventEmitter.emit('GET_SELECTED_DEVICE', response);

  return response.selectedDevice;
};

const setSelectedDevice = (device: IDeviceInfo | null): void => {
  topBarEventEmitter.emit('SET_SELECTED_DEVICE', device);
};

export default {
  getSelectedDevice,
  offTitleChange,
  onTitleChange,
  setHasUnsavedChange,
  setSelectedDevice,
  updateTitle,
};
