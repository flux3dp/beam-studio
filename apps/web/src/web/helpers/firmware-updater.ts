/**
 * firmware updater
 */
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import DeviceMaster from 'helpers/device-master';
import Dialog from 'app/actions/dialog-caller';
import i18n from 'helpers/i18n';
import InputLightboxConstants from 'app/constants/input-lightbox-constants';
import Progress from 'app/actions/progress-caller';
import { IDeviceInfo } from 'interfaces/IDevice';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';

export default (response, device: IDeviceInfo, forceUpdate?: boolean): void => {
  const { lang } = i18n;

  const onFinishUpdate = (isSuccess: boolean) => {
    if (isSuccess === true) {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_INFO,
        message: lang.update.firmware.update_success,
      });
    } else {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: lang.update.firmware.update_fail,
      });
    }
  };

  const doUpdate = DeviceMaster.updateFirmware;

  const uploadToDevice = async (file) => {
    const res = await DeviceMaster.select(device);
    if (res.success) {
      Progress.openSteppingProgress({
        id: 'update-firmware',
        caption: lang.topbar.menu.update_firmware,
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
      } catch (error) {
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
      key: 'downloading-firmware',
      level: MessageLevel.LOADING,
      content: i18n.lang.update.software.checking,
      duration: 10,
    });

    req.onload = function onload() {
      if (this.status === 200) {
        const file = req.response;
        uploadToDevice(file);
      } else {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: lang.update.cannot_reach_internet,
        });
      }
    };
    req.send();
  };

  const onSubmit = async (files) => {
    const file = files.item(0);
    const res = await DeviceMaster.select(device);
    if (res.success) {
      Progress.openSteppingProgress({ id: 'update-firmware', message: `${lang.update.updating} (0%)` });
      try {
        await doUpdate(file, (r) => {
          const percentage = Number(r.percentage || 0).toFixed(2);
          Progress.update('update-firmware', {
            message: `${lang.update.updating} (${percentage}%)`,
            percentage,
          });
        });
        onFinishUpdate(true);
      } catch (error) {
        onFinishUpdate(false);
      }
      Progress.popById('update-firmware');
    }
  };

  const onInstall = () => {
    Dialog.showInputLightbox('upload-firmware', {
      type: InputLightboxConstants.TYPE_FILE,
      caption: lang.update.firmware.upload_file,
      confirmText: lang.update.firmware.confirm,
      onSubmit,
      onCancel: () => { },
    });
  };

  if (forceUpdate) {
    onInstall();
  } else {
    Dialog.showFirmwareUpdateDialog(device, response || {}, onDownload, onInstall);
  }
};
