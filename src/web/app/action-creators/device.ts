import C from '../constants/action-creator-device';
const updateDeviceStatus = (status) => ({
    type: C.UPDATE_DEVICE_STATUS,
    status
});

const updateJobInfo = (jobInfo) => ({
    type: C.UPDATE_JOB_INFO,
    jobInfo
});

const updateUsbFolderExistance = (usbFolderExist) => ({
    type: C.UPDATE_USB_FOLDER_EXISTANCE,
    usbFolderExist
});

export default {
    updateDeviceStatus,
    updateJobInfo,
    updateUsbFolderExistance
};
