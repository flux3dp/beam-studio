/**
 * firmware updater
 */
import Alert from '@core/app/actions/alert-caller';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { showFirmwareUpdateDialog } from '@core/app/components/dialogs/updateFirmware';
import AlertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { uploadToDevice } from './upload';

export const firmwareUpdater = (
  response:
    | {
        changelog_en: string;
        changelog_zh: string;
        downloadUrl: string;
        latestVersion: string;
        needUpdate: true;
      }
    | { needUpdate: false },
  device: IDeviceInfo,
  forceUpdate?: boolean,
): void => {
  const { lang } = i18n;

  const onSubmit = async (files: FileList) => {
    const file = files.item(0)!;

    await uploadToDevice(device, file, 'firmware');
  };

  const uploadManually = () => {
    Dialog.showInputLightbox('upload-firmware', {
      caption: lang.update.firmware.upload_file,
      confirmText: lang.update.firmware.confirm,
      onSubmit,
      type: 'file',
    });
  };

  if (forceUpdate || !('downloadUrl' in response)) {
    uploadManually();
  } else {
    const onDownload = () => {
      const req = new XMLHttpRequest();

      // get firmware from flux3dp website.
      // TODO: change to fetch api
      req.open('GET', response.downloadUrl!, true);
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

          uploadToDevice(device, file, 'firmware');
        } else {
          Alert.popUp({
            message: lang.update.cannot_reach_internet,
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
        }
      };
      req.send();
    };

    showFirmwareUpdateDialog(device, response, onDownload, uploadManually);
  }
};

export default firmwareUpdater;
