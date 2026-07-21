import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { eventEmitter } from '@core/app/contexts/DialogContext';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
// Trigger some dialog here to avoid dialog caller circular import

export const addDialogComponent = (id: string, component: React.JSX.Element): void => {
  eventEmitter.emit('ADD_DIALOG_COMPONENT', id, component);
};

export const clearAllDialogComponents = (): void => {
  eventEmitter.emit('CLEAR_ALL_DIALOG_COMPONENTS');
};

export const isIdExist = (id: string): boolean => {
  const response = {
    isIdExist: false,
  };

  eventEmitter.emit('CHECK_ID_EXIST', id, response);

  return response.isIdExist;
};

export const popDialogById = (id: string): void => {
  eventEmitter.emit('POP_DIALOG_BY_ID', id);
};

export const showCalibrateCamera = (
  device: IDeviceInfo,
  options?: { factoryMode?: boolean; isAdvanced?: boolean; isBorderless?: boolean; isWideAngle?: boolean },
): void => {
  eventEmitter.emit('SHOW_CALIBRATE_CAMERA', device, options);
};

export const showConnectionIssueGuide = (model?: WorkAreaModel): void => {
  eventEmitter.emit('SHOW_CONNECTION_ISSUE_GUIDE', model);
};

export const showFluxPlusWarning = (monotype?: boolean): void => {
  eventEmitter.emit('SHOW_FLUX_PLUS_WARNING', monotype);
};

export default {};
