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
};

const statusButtonTypeMap = {};
statusButtonTypeMap[DeviceConstants.status.INIT] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };
statusButtonTypeMap[DeviceConstants.status.STARTING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_STARTING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };
statusButtonTypeMap[DeviceConstants.status.RUNNING] = { left: ButtonTypes.STOP, mid: ButtonTypes.PAUSE };
statusButtonTypeMap[DeviceConstants.status.RESUME_TO_RUNNING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };
statusButtonTypeMap[DeviceConstants.status.PAUSED] = { left: ButtonTypes.STOP, mid: ButtonTypes.PLAY };
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_STARTING] = { left: ButtonTypes.STOP, mid: ButtonTypes.PLAY };
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_STARTING] = { left: ButtonTypes.STOP, mid: ButtonTypes.DISABLED_PLAY };
statusButtonTypeMap[DeviceConstants.status.PAUSED_FROM_RUNNING] = { left: ButtonTypes.STOP, mid: ButtonTypes.PLAY };
statusButtonTypeMap[DeviceConstants.status.PAUSING_FROM_RUNNING] = { left: ButtonTypes.STOP, mid: ButtonTypes.DISABLED_PLAY };
statusButtonTypeMap[DeviceConstants.status.COMPLETED] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.PLAY };
statusButtonTypeMap[DeviceConstants.status.COMPLETING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };
statusButtonTypeMap[DeviceConstants.status.PREPARING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PLAY };
statusButtonTypeMap[DeviceConstants.status.ABORTED] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.PLAY };
statusButtonTypeMap[DeviceConstants.status.ABORTING] = { left: ButtonTypes.DISABLED_STOP, mid: ButtonTypes.DISABLED_PAUSE };

export default {
    getDisplayStatus: (stLabel: string) => {
        const statusMap = {
            IDLE: i18n.lang.device.ready,
            INIT: i18n.lang.device.starting,
            STARTING: i18n.lang.device.starting,
            RUNNING: i18n.lang.device.running,
            PAUSED: i18n.lang.device.paused,
            PAUSING: i18n.lang.device.pausing,
            COMPLETING: i18n.lang.device.completing,
            COMPLETED: i18n.lang.device.completed,
            ABORTING: i18n.lang.device.aborting,
            ABORTED: i18n.lang.device.aborted,
            RESUMING: i18n.lang.device.starting,
            OCCUPIED: i18n.lang.device.occupied,
            SCANNING: i18n.lang.device.scanning,
            PREPARING: i18n.lang.device.completed,
        }
        return statusMap[stLabel] || '';
    },
    isAbortedOrCompleted: (report: IReport) => {
        if (!report) return false;
        return (
            report.st_id === DeviceConstants.status.ABORTED ||
            report.st_id === DeviceConstants.status.COMPLETED
        );
    },
    getControlButtonType: (report: IReport) => {
        if (!report) {
            return {
                left: ButtonTypes.DISABLED_STOP,
                mid: ButtonTypes.DISABLED_PLAY,
            };
        }
        if (statusButtonTypeMap[report.st_id]) {
            return statusButtonTypeMap[report.st_id];
        } else {
            return {
                left: ButtonTypes.DISABLED_STOP,
                mid: ButtonTypes.DISABLED_PLAY,
            };
        }
    },
    allowedCameraStatus: [
        DeviceConstants.status.IDLE,
        DeviceConstants.status.PAUSED,
        DeviceConstants.status.PAUSED_FROM_STARTING,
        DeviceConstants.status.PAUSED_FROM_RUNNING,
        DeviceConstants.status.COMPLETED,
        DeviceConstants.status.ABORTED,
    ],
};
