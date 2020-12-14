import DeviceConstants from './device-constants';
let monitorLang;

export default {
    setLang: (l) => {
        monitorLang = l;
    },

    IDLE: () => ({
        displayStatus: monitorLang.device.ready,
        currentStatus: DeviceConstants.READY
    }),

    INIT: () => ({
        displayStatus: monitorLang.device.starting,
        currentStatus: DeviceConstants.STARTING
    }),

    STARTING: () => ({
        displayStatus: monitorLang.device.starting,
        currentStatus: ''
    }),

    RUNNING: () => ({
        displayStatus: monitorLang.device.running,
        currentStatus: DeviceConstants.RUNNING
    }),

    PAUSED: () => ({
        displayStatus: monitorLang.device.paused,
        currentStatus: DeviceConstants.PAUSED
    }),

    PAUSING: () => ({
        displayStatus: monitorLang.device.pausing,
        currentStatus: DeviceConstants.PAUSED
    }),

    WAITING_HEAD: () => ({
        displayStatus: monitorLang.device.heating,
        currentStatus: DeviceConstants.HEATING
    }),

    CORRECTING: () => ({
        displayStatus: monitorLang.device.calibrating,
        currentStatus: DeviceConstants.CALIBRATING
    }),

    COMPLETING: () => ({
        displayStatus: monitorLang.device.completing,
        currentStatus: ''
    }),

    COMPLETED: () => ({
        displayStatus: monitorLang.device.completed,
        currentStatus: ''
    }),

    ABORTING: () => ({
        displayStatus: monitorLang.device.aborting,
        currentStatus: ''
    }),

    ABORTED: () => ({
        displayStatus: monitorLang.device.aborted,
        currentStatus: ''
    }),

    RESUMING: () => ({
        displayStatus: monitorLang.device.starting,
        currentStatus: DeviceConstants.RUNNING
    }),

    OCCUPIED: () => ({
        displayStatus: monitorLang.device.occupied,
        currentStatus: DeviceConstants.PAUSED
    }),

    SCANNING: () => ({
        displayStatus: monitorLang.device.scanning,
        currentStatus: ''
    }),

    PREPARING: () => ({
        displayStatus: monitorLang.device.completed,
        currentStatus: ''
    })
};
