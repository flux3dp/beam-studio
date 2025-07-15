import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import FileExportHelper from '@core/helpers/file-export-helper';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

const LANG = i18n.lang.update.software;

const checkForUpdate = (isAutoCheck: boolean) => {
  if (!isAutoCheck) {
    Progress.openNonstopProgress({ id: 'electron-check-update', message: LANG.checking });
  }

  let hasGetResponse = false;

  communicator.send('CHECK_FOR_UPDATE');
  setTimeout(() => {
    if (!hasGetResponse) {
      if (!isAutoCheck) {
        Progress.popById('electron-check-update');
        Alert.popUp({
          caption: LANG.check_update,
          message: LANG.no_response,
        });
      }
    }
  }, 15000);
  communicator.once(
    'UPDATE_AVAILABLE',
    (event: any, res: { error: { code: any }; info: { version: string }; isUpdateAvailable: any }) => {
      hasGetResponse = true;

      if (!isAutoCheck) {
        Progress.popById('electron-check-update');
      }

      if (res.error) {
        console.log(res.error);

        if (!isAutoCheck) {
          Alert.popUp({
            caption: LANG.check_update,
            message: `#829 Error: ${res.error.code} `,
          });
        }

        return;
      }

      const { FLUX } = window;
      const channel = res.info.version.split('-')[1] || 'latest';
      const currentChannel = FLUX?.version?.split('-')[1] || 'latest';

      if (currentChannel !== channel) {
        console.log(`Current Channel: ${currentChannel}, But got: ${channel}`);
      }

      if (res.isUpdateAvailable && channel === currentChannel) {
        const msg = sprintf(LANG.available_update, res.info.version, FLUX.version);

        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.check_update,
          message: msg,
          onNo: () => {
            communicator.once('UPDATE_DOWNLOADED', () => {});
          },
          onYes: () => {
            communicator.once('UPDATE_DOWNLOADED', (e: any, info: { version: any }) => {
              const downloadedMsg = `Beam Studio v${info.version} ${LANG.install_or_not}`;

              Alert.popUp({
                buttonType: AlertConstants.YES_NO,
                caption: LANG.check_update,
                message: downloadedMsg,
                onYes: async () => {
                  const unsavedDialogRes = await FileExportHelper.toggleUnsavedChangedDialog();

                  if (unsavedDialogRes) {
                    communicator.send('QUIT_AND_INSTALL');
                  }
                },
              });
            });
            communicator.on('DOWNLOAD_PROGRESS', (e: any, progress: { percent: any }) => {
              console.log('progress:', progress.percent);
            });
            Alert.popUp({
              caption: LANG.check_update,
              message: LANG.downloading,
            });
            communicator.send('DOWNLOAD_UPDATE');
          },
        });
      } else if (!isAutoCheck) {
        Alert.popUp({
          caption: LANG.check_update,
          message: LANG.not_found,
        });
      }
    },
  );
};

const switchVersion = (): void => {
  const { FLUX } = window;
  const currentChannel = FLUX.version.split('-')[1];

  Progress.openNonstopProgress({ id: 'electron-check-switch', message: LANG.checking });

  const targetChannel = currentChannel ? 'latest' : 'beta';

  communicator.send('CHECK_FOR_UPDATE', targetChannel);
  communicator.once(
    'UPDATE_AVAILABLE',
    (event: any, res: { error: { code: any }; info: { version: any }; isUpdateAvailable: any }) => {
      Progress.popById('electron-check-switch');

      if (res.error) {
        console.log(res.error);
        Alert.popUp({
          caption: LANG.switch_version,
          message: `#829 Error: ${res.error.code} `,
        });

        return;
      }

      if (res.isUpdateAvailable) {
        const msg = sprintf(LANG.available_switch, res.info.version, FLUX.version);

        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.switch_version,
          message: msg,
          onNo: () => {
            communicator.once('UPDATE_DOWNLOADED', () => {});
          },
          onYes: () => {
            communicator.once('UPDATE_DOWNLOADED', (e: any, info: { version: any }) => {
              const downloadedMsg = `Beam Studio v${info.version} ${LANG.switch_or_not}`;

              Alert.popUp({
                buttonType: AlertConstants.YES_NO,
                caption: LANG.switch_version,
                message: downloadedMsg,
                onYes: async () => {
                  const unsavedDialogRes = await FileExportHelper.toggleUnsavedChangedDialog();

                  if (unsavedDialogRes) {
                    communicator.send('QUIT_AND_INSTALL');
                  }
                },
              });
            });
            communicator.on('DOWNLOAD_PROGRESS', (e: any, progress: { percent: any }) => {
              console.log('progress:', progress.percent);
            });
            Alert.popUp({
              caption: LANG.switch_version,
              message: LANG.downloading,
            });
            communicator.send('DOWNLOAD_UPDATE');
          },
        });
      } else {
        Alert.popUp({
          caption: LANG.switch_version,
          message: LANG.switch_version_not_found,
        });
      }
    },
  );
};

export default {
  autoCheck(): void {
    const doCheck = storage.get('auto_check_update');

    if (doCheck) {
      checkForUpdate(true);
    }
  },
  checkForUpdate(): void {
    checkForUpdate(false);
  },
  switchVersion,
};
