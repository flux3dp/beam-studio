import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import checkSoftwareForAdor from '@core/helpers/check-software';
import dialogCaller from '@core/app/actions/dialog-caller';
import i18n from '@core/helpers/i18n';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import storage from '@app/implementations/storage';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import { IDeviceInfo } from '@core/interfaces/IDevice';
import { promarkModels } from '@core/app/actions/beambox/constant';
import { SelectionResult } from '@core/app/constants/connection-constants';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import DeviceMaster from '../device-master';
import showResizeAlert from './fit-device-workarea-alert';

const getDevice = async (
  showModal = false,
): Promise<{ device: IDeviceInfo | null; isWorkareaMatched?: boolean }> => {
  const currentDevice = TopBarController.getSelectedDevice();
  let device = showModal ? null : currentDevice;
  let isWorkareaMatched = null;
  if (device) {
    let selectRes: SelectionResult = { success: true };
    let statusRes;
    try {
      if (
        DeviceMaster.currentDevice?.info.serial !== device.serial ||
        !DeviceMaster.currentDevice?.control?.isConnected
      ) {
        selectRes = await DeviceMaster.select(device);
      } else if (DeviceMaster.currentDevice?.control?.getMode() === 'raw') {
        await DeviceMaster.endRawMode();
      } else if (DeviceMaster.currentDevice?.control?.getMode() === 'cartridge_io') {
        await DeviceMaster.endCartridgeIOMode();
      } else if (DeviceMaster.currentDevice?.control?.getMode() === 'red_laser_measure') {
        await DeviceMaster.endRedLaserMeasureMode();
      }
      if (selectRes.success) {
        // get current status
        statusRes = await DeviceMaster.getReport();
      }
    } catch (error) {
      console.error('getDeviceError', error);
      await DeviceMaster.currentDevice?.control?.killSelf();
    }
    if (!statusRes || !selectRes.success) {
      device = null;
      MessageCaller.openMessage({
        key: 'reconnect-fail',
        level: MessageLevel.INFO,
        content: i18n.lang.message.device_not_found.caption,
        duration: 3,
      });
    } else {
      // update device status
      device = { ...device, ...statusRes };
    }
  }
  if (!device) {
    const autoSelect = storage.get('auto_connect') !== 0;
    const devices = DeviceMaster.getAvailableDevices();
    device =
      !showModal && autoSelect && devices.length === 1
        ? devices[0]
        : await dialogCaller.selectDevice();
    if (device && !checkSoftwareForAdor(device)) {
      return { device: null };
    }
    TopBarController.setSelectedDevice(device);
    if (device) {
      const { uuid, model } = device;
      const isNewDevice = currentDevice?.uuid !== uuid;
      if (isNewDevice) {
        storage.set('selected-device', uuid);
      }
      const res = await DeviceMaster.select(device);
      if (res.success) {
        if (promarkModels.has(model)) {
          storage.set('last-promark-serial', device.serial);
          const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
          canvasEvents.emit('document-settings-saved');
        }
        isWorkareaMatched = model === BeamboxPreference.read('workarea');
        if (!isWorkareaMatched && isNewDevice) {
          isWorkareaMatched = await showResizeAlert(device);
        }
      } else {
        Alert.popUp({
          id: 'fatal-occurred',
          caption: i18n.lang.alert.oops,
          message: `#813 ${res.error}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    }
  } else {
    isWorkareaMatched = device.model === BeamboxPreference.read('workarea');
  }
  return { device, isWorkareaMatched };
};

export default getDevice;
