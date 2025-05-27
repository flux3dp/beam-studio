import DeviceConstants from '@core/app/constants/device-constants';
import i18n from '@core/helpers/i18n';
import type { IReport } from '@core/interfaces/IDevice';

/* eslint-disable perfectionist/sort-enums */
export enum ButtonTypes {
  NONE = 0,
  PLAY = 1,
  DISABLED_PLAY = 2,
  PAUSE = 3,
  DISABLED_PAUSE = 4,
  STOP = 5,
  DISABLED_STOP = 6,
  RESUME = 7,
  DISABLED_RESUME = 8,
}
/* eslint-enable perfectionist/sort-enums */

const statusButtonTypeMap: { [status: number]: ButtonTypes[] } = {};

statusButtonTypeMap[DeviceConstants.status.IDLE] = [ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.INIT] = [ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.STARTING] = [ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_STARTING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PAUSE,
];
statusButtonTypeMap[DeviceConstants.status.RUNNING] = [ButtonTypes.STOP, ButtonTypes.PAUSE];
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_RUNNING] = [ButtonTypes.DISABLED_STOP, ButtonTypes.DISABLED_PAUSE];
statusButtonTypeMap[DeviceConstants.status.PAUSED] = [ButtonTypes.STOP, ButtonTypes.RESUME];
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_STARTING] = [ButtonTypes.STOP, ButtonTypes.RESUME];
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_STARTING] = [ButtonTypes.STOP, ButtonTypes.DISABLED_RESUME];
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_RUNNING] = [ButtonTypes.STOP, ButtonTypes.RESUME];
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_RUNNING] = [ButtonTypes.STOP, ButtonTypes.DISABLED_RESUME];
statusButtonTypeMap[DeviceConstants.status.COMPLETED] = [ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.COMPLETING] = [ButtonTypes.DISABLED_STOP, ButtonTypes.DISABLED_PAUSE];
statusButtonTypeMap[DeviceConstants.status.PREPARING] = [ButtonTypes.DISABLED_STOP, ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.ABORTED] = [ButtonTypes.DISABLED_STOP, ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.ABORTING] = [ButtonTypes.DISABLED_STOP, ButtonTypes.DISABLED_PAUSE];
statusButtonTypeMap[DeviceConstants.status.ALARM] = [ButtonTypes.STOP, ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.FATAL] = [ButtonTypes.STOP, ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.TOOLHEAD_CHANGE] = [ButtonTypes.STOP];
statusButtonTypeMap[DeviceConstants.status.RECONNECTING] = [ButtonTypes.STOP, ButtonTypes.DISABLED_PAUSE];

const stIdLabelMap: Record<number, string> = (() => {
  const res: Record<number, string> = {};
  const keys = Object.keys(DeviceConstants.status);

  for (let i = 0; i < keys.length; i++) {
    res[DeviceConstants.status[keys[i]]] = keys[i];
  }

  return res;
})();

export default {
  allowedCameraStatus: [
    DeviceConstants.status.IDLE,
    DeviceConstants.status.RUNNING,
    DeviceConstants.status.PAUSED,
    DeviceConstants.status.PAUSED_FROM_STARTING,
    DeviceConstants.status.PAUSED_FROM_RUNNING,
    DeviceConstants.status.COMPLETED,
    DeviceConstants.status.ABORTED,
  ],
  getControlButtonType: (report: IReport): ButtonTypes[] => {
    if (!report) {
      return [];
    }

    if (statusButtonTypeMap[report.st_id]) {
      return statusButtonTypeMap[report.st_id];
    }

    return [];
  },
  getDisplayStatus: (stLabel: string): string => {
    if (!stLabel) {
      return '';
    }

    const key = stLabel.replace(/^"+|"+$/g, '');
    const lang = i18n.lang.device;
    const statusMap = {
      ABORTED: lang.aborted,
      ABORTING: lang.aborting,
      COMPLETED: lang.completed,
      COMPLETING: lang.completing,
      IDLE: lang.ready,
      INIT: lang.starting,
      OCCUPIED: lang.occupied,
      PAUSED: lang.paused,
      PAUSING: lang.pausing,
      PREPARING: lang.completed,
      RECONNECTING: lang.reconnecting,
      RESUMING: lang.starting,
      RUNNING: lang.running,
      SCANNING: lang.scanning,
      STARTING: lang.starting,
      TOOLHEAD_CHANGE: lang.toolhead_change,
    };

    return statusMap[key] || stLabel || '';
  },
  getStLabel: (stId: number): string => stIdLabelMap[stId] || '',
  isAbortedOrCompleted: (report: IReport): boolean => {
    if (!report) {
      return false;
    }

    return report.st_id === DeviceConstants.status.ABORTED || report.st_id === DeviceConstants.status.COMPLETED;
  },
};
