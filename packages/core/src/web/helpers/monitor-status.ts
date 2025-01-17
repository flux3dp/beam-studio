import DeviceConstants from 'app/constants/device-constants';
import i18n from 'helpers/i18n';
import { IReport } from 'interfaces/IDevice';

export enum ButtonTypes {
  NONE = 0,
  PLAY = 1,
  DISABLED_PLAY = 2,
  PAUSE = 3,
  DISABLED_PAUSE = 4,
  STOP = 5,
  DISABLED_STOP = 6,
}

const statusButtonTypeMap: { [status: number]: ButtonTypes[] } = {};
statusButtonTypeMap[DeviceConstants.status.INIT] = [ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.STARTING] = [ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_STARTING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PAUSE,
];
statusButtonTypeMap[DeviceConstants.status.RUNNING] = [ButtonTypes.STOP, ButtonTypes.PAUSE];
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_RUNNING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PAUSE,
];
statusButtonTypeMap[DeviceConstants.status.PAUSED] = [ButtonTypes.STOP, ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_STARTING] = [
  ButtonTypes.STOP,
  ButtonTypes.PLAY,
];
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_STARTING] = [
  ButtonTypes.STOP,
  ButtonTypes.DISABLED_PLAY,
];
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_RUNNING] = [
  ButtonTypes.STOP,
  ButtonTypes.PLAY,
];
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_RUNNING] = [
  ButtonTypes.STOP,
  ButtonTypes.DISABLED_PLAY,
];
statusButtonTypeMap[DeviceConstants.status.COMPLETED] = [ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.COMPLETING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PAUSE,
];
statusButtonTypeMap[DeviceConstants.status.PREPARING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PLAY,
];
statusButtonTypeMap[DeviceConstants.status.ABORTED] = [ButtonTypes.DISABLED_STOP, ButtonTypes.PLAY];
statusButtonTypeMap[DeviceConstants.status.ABORTING] = [
  ButtonTypes.DISABLED_STOP,
  ButtonTypes.DISABLED_PAUSE,
];
statusButtonTypeMap[DeviceConstants.status.ALARM] = [ButtonTypes.STOP, ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.FATAL] = [ButtonTypes.STOP, ButtonTypes.DISABLED_PLAY];
statusButtonTypeMap[DeviceConstants.status.TOOLHEAD_CHANGE] = [ButtonTypes.STOP];

const stIdLabelMap: Record<number, string> = (() => {
  const res: Record<number, string> = {};
  const keys = Object.keys(DeviceConstants.status);
  for (let i = 0; i < keys.length; i++) {
    res[DeviceConstants.status[keys[i]]] = keys[i];
  }
  return res;
})();

export default {
  getStLabel: (stId: number): string => stIdLabelMap[stId] || '',
  getDisplayStatus: (stLabel: string): string => {
    if (!stLabel) return '';
    const key = stLabel.replace(/^"+|"+$/g, '');
    const lang = i18n.lang.device;
    const statusMap = {
      IDLE: lang.ready,
      INIT: lang.starting,
      STARTING: lang.starting,
      RUNNING: lang.running,
      PAUSED: lang.paused,
      PAUSING: lang.pausing,
      COMPLETING: lang.completing,
      COMPLETED: lang.completed,
      ABORTING: lang.aborting,
      ABORTED: lang.aborted,
      RESUMING: lang.starting,
      OCCUPIED: lang.occupied,
      SCANNING: lang.scanning,
      PREPARING: lang.completed,
      TOOLHEAD_CHANGE: lang.toolhead_change,
    };
    return statusMap[key] || stLabel || '';
  },
  isAbortedOrCompleted: (report: IReport): boolean => {
    if (!report) return false;
    return (
      report.st_id === DeviceConstants.status.ABORTED ||
      report.st_id === DeviceConstants.status.COMPLETED
    );
  },
  getControlButtonType: (report: IReport): ButtonTypes[] => {
    if (!report) {
      return [];
    }
    if (statusButtonTypeMap[report.st_id]) {
      return statusButtonTypeMap[report.st_id];
    }
    return [];
  },
  allowedCameraStatus: [
    DeviceConstants.status.IDLE,
    DeviceConstants.status.RUNNING,
    DeviceConstants.status.PAUSED,
    DeviceConstants.status.PAUSED_FROM_STARTING,
    DeviceConstants.status.PAUSED_FROM_RUNNING,
    DeviceConstants.status.COMPLETED,
    DeviceConstants.status.ABORTED,
  ],
};
