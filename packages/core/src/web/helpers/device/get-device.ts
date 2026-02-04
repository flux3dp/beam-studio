import Alert from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import AlertConstants from '@core/app/constants/alert-constants';
import type { SelectionResult } from '@core/app/constants/connection-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import checkSoftwareForAdor from '@core/helpers/check-software';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import DeviceMaster from '../device-master';

import showResizeAlert from './fit-device-workarea-alert';

const getDevice = async (showModal = false): Promise<{ device: IDeviceInfo | null; isWorkareaMatched?: boolean }> => {
  const currentDevice = TopBarController.getSelectedDevice();
  let device = showModal ? null : currentDevice;
  let isWorkareaMatched = undefined;

  if (device) {
    let selectRes: SelectionResult = { success: true };
    let statusRes;

    try {
      if (
        DeviceMaster.currentDevice?.info.serial !== device.serial ||
        !DeviceMaster.currentDevice?.control?.isConnected
      ) {
        selectRes = await DeviceMaster.select(device);
      } else if (DeviceMaster.currentDevice?.control?.getMode() !== '') {
        await DeviceMaster.endSubTask();
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
        content: i18n.lang.message.device_not_found.caption,
        duration: 3,
        key: 'reconnect-fail',
        level: MessageLevel.INFO,
      });
    } else {
      // update device status
      device = { ...device, ...statusRes };
    }
  }

  if (!device) {
    const autoSelect = storage.get('auto_connect');
    const devices = DeviceMaster.getAvailableDevices();

    device = !showModal && autoSelect && devices.length === 1 ? devices[0] : await dialogCaller.selectDevice();

    if (device && !checkSoftwareForAdor(device)) {
      return { device: null };
    }

    TopBarController.setSelectedDevice(device);

    if (device) {
      const { model, uuid } = device;
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

        isWorkareaMatched = model === useDocumentStore.getState().workarea;

        if (!isWorkareaMatched && isNewDevice) {
          isWorkareaMatched = await showResizeAlert(device);
        }
      } else {
        Alert.popUp({
          caption: i18n.lang.alert.oops,
          id: 'fatal-occurred',
          message: `#813 ${res.error}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    }
  } else {
    isWorkareaMatched = device.model === useDocumentStore.getState().workarea;
  }

  return { device, isWorkareaMatched };
};

export default getDevice;
