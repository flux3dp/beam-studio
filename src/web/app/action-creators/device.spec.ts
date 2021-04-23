import DeviceActionCreator from './device';
import DeviceActionType from '../constants/action-creator-device';

describe('test device action creator', () => {
  test('updateDeviceStatus', () => {
    const result = DeviceActionCreator.updateDeviceStatus({ st_label: 'INIT', st_id: 1 });
    expect(result).toEqual({
      type: DeviceActionType.UPDATE_DEVICE_STATUS,
      status: {
        st_label: 'INIT',
        st_id: 1,
      },
    });
  });

  test('updateJobInfo', () => {
    const result = DeviceActionCreator.updateJobInfo({ name: 'this is the test job', id: 1 });
    expect(result).toEqual({
      type: DeviceActionType.UPDATE_JOB_INFO,
      jobInfo: {
        name: 'this is the test job',
        id: 1,
      },
    });
  });

  test('updateUsbFolderExistance', () => {
    const result = DeviceActionCreator.updateUsbFolderExistance(true);
    expect(result).toEqual({
      type: DeviceActionType.UPDATE_USB_FOLDER_EXISTANCE,
      usbFolderExist: true,
    });
  });
});
