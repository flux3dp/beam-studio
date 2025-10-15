/**
 * firmware updater
 */
import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { showFirmwareUpdateDialog, showUploadFirmwareDialog } from '@core/app/components/dialogs/updateFirmware';
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

  if (forceUpdate || !('downloadUrl' in response)) {
    showUploadFirmwareDialog(device, 'firmware');
  } else {
    const onDownload = () => {
      const req = new XMLHttpRequest();

      // get firmware from flux3dp website.
      // TODO: change to fetch api
      req.open('GET', response.downloadUrl!, true);
      req.responseType = 'blob';

      MessageCaller.openMessage({
        content: lang.update.software.checking,
        duration: 10,
        key: 'downloading-firmware',
        level: MessageLevel.LOADING,
      });

      req.onload = function onload() {
        if (this.status === 200) {
          const file = req.response;

          uploadToDevice(device, file, 'firmware');
        } else {
          alertCaller.popUpError({ message: lang.update.cannot_reach_internet });
        }
      };
      req.send();
    };

    showFirmwareUpdateDialog(device, response, onDownload, () => showUploadFirmwareDialog(device, 'firmware'));
  }
};

export default firmwareUpdater;
