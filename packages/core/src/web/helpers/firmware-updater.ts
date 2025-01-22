/**
 * firmware updater
 */
import Alert from '@core/app/actions/alert-caller';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import InputLightboxConstants from '@core/app/constants/input-lightbox-constants';
import DeviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export default (response, device: IDeviceInfo, forceUpdate?: boolean): void => {
  const { lang } = i18n;

  const onFinishUpdate = (isSuccess: boolean) => {
    if (isSuccess === true) {
      Alert.popUp({
        message: lang.update.firmware.update_success,
        type: AlertConstants.SHOW_POPUP_INFO,
      });
    } else {
      Alert.popUp({
        message: lang.update.firmware.update_fail,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }
  };

  const doUpdate = DeviceMaster.updateFirmware;

  const uploadToDevice = async (file) => {
    const res = await DeviceMaster.select(device);

    if (res.success) {
      Progress.openSteppingProgress({
        caption: lang.topbar.menu.update_firmware,
        id: 'update-firmware',
        message: lang.update.updating,
      });
      try {
        await doUpdate(file, (r) => {
          const percentage = Number(r.percentage || 0).toFixed(2);

          Progress.update('update-firmware', {
            caption: lang.topbar.menu.update_firmware,
            message: lang.update.updating,
            percentage,
          });
        });
        onFinishUpdate(true);
      } catch {
        onFinishUpdate(false);
      }
      Progress.popById('update-firmware');
    }
  };

  const onDownload = () => {
    const req = new XMLHttpRequest();

    // get firmware from flux3dp website.
    req.open('GET', response.downloadUrl, true);
    req.responseType = 'blob';

    MessageCaller.openMessage({
      content: i18n.lang.update.software.checking,
      duration: 10,
      key: 'downloading-firmware',
      level: MessageLevel.LOADING,
    });

    req.onload = function onload() {
      if (this.status === 200) {
        const file = req.response;

        uploadToDevice(file);
      } else {
        Alert.popUp({
          message: lang.update.cannot_reach_internet,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    };
    req.send();
  };

  const onSubmit = async (files) => {
    const file = files.item(0);
    const res = await DeviceMaster.select(device);

    if (res.success) {
      Progress.openSteppingProgress({
        id: 'update-firmware',
        message: `${lang.update.updating} (0%)`,
      });
      try {
        await doUpdate(file, (r) => {
          const percentage = Number(r.percentage || 0).toFixed(2);

          Progress.update('update-firmware', {
            message: `${lang.update.updating} (${percentage}%)`,
            percentage,
          });
        });
        onFinishUpdate(true);
      } catch {
        onFinishUpdate(false);
      }
      Progress.popById('update-firmware');
    }
  };

  const onInstall = () => {
    Dialog.showInputLightbox('upload-firmware', {
      caption: lang.update.firmware.upload_file,
      confirmText: lang.update.firmware.confirm,
      onCancel: () => {},
      onSubmit,
      type: InputLightboxConstants.TYPE_FILE,
    });
  };

  if (forceUpdate) {
    onInstall();
  } else {
    Dialog.showFirmwareUpdateDialog(device, response || {}, onDownload, onInstall);
  }
};
