import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import tabController from '@core/app/actions/tabController';
import AlertConstants from '@core/app/constants/alert-constants';
import { UpdateEvents } from '@core/app/constants/ipcEvents';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

const checkForUpdate = (isAutoCheck: boolean) => {
  const LANG = i18n.lang.update.software;

  if (!isAutoCheck) {
    Progress.openNonstopProgress({ id: 'electron-check-update', message: LANG.checking });
  }

  let hasGetResponse = false;

  communicator.send(UpdateEvents.CheckForUpdate);
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
    UpdateEvents.UpdateAvailable,
    (event: any, res: { error: { code: any }; info: { version: string }; isUpdateAvailable: any }) => {
      hasGetResponse = true;

      if (!isAutoCheck) {
        Progress.popById('electron-check-update');
      }

      if (res?.error) {
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

      if (res?.isUpdateAvailable && channel === currentChannel) {
        const msg = sprintf(LANG.available_update, res.info.version, FLUX.version);

        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.check_update,
          message: msg,
          onNo: () => {
            communicator.once(UpdateEvents.UpdateDownloaded, () => {});
          },
          onYes: () => {
            communicator.once(UpdateEvents.UpdateDownloaded, (e: any, info: { version: any }) => {
              const downloadedMsg = `Beam Studio v${info.version} ${LANG.install_or_not}`;

              Alert.popUp({
                buttonType: AlertConstants.YES_NO,
                caption: LANG.check_update,
                message: downloadedMsg,
                onYes: async () => {
                  const unsavedDialogRes = await toggleUnsavedChangedDialog();

                  if (unsavedDialogRes) {
                    communicator.send(UpdateEvents.QuitAndInstall);
                  }
                },
              });
            });
            communicator.on(UpdateEvents.DownloadProgress, (e: any, progress: { percent: any }) => {
              console.log('progress:', progress.percent);
            });
            Alert.popUp({
              caption: LANG.check_update,
              message: LANG.downloading,
            });
            communicator.send(UpdateEvents.DownloadUpdate);
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
  const LANG = i18n.lang.update.software;
  const { FLUX } = window;
  const currentChannel = FLUX.version.split('-')[1];

  Progress.openNonstopProgress({ id: 'electron-check-switch', message: LANG.checking });

  const targetChannel = currentChannel ? 'latest' : 'beta';

  communicator.send(UpdateEvents.CheckForUpdate, targetChannel);
  communicator.once(
    UpdateEvents.UpdateAvailable,
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
            communicator.once(UpdateEvents.UpdateDownloaded, () => {});
          },
          onYes: () => {
            communicator.once(UpdateEvents.UpdateDownloaded, (e: any, info: { version: any }) => {
              const downloadedMsg = `Beam Studio v${info.version} ${LANG.switch_or_not}`;

              Alert.popUp({
                buttonType: AlertConstants.YES_NO,
                caption: LANG.switch_version,
                message: downloadedMsg,
                onYes: async () => {
                  const unsavedDialogRes = await toggleUnsavedChangedDialog();

                  if (unsavedDialogRes) {
                    communicator.send(UpdateEvents.QuitAndInstall);
                  }
                },
              });
            });
            communicator.on(UpdateEvents.DownloadProgress, (e: any, progress: { percent: any }) => {
              console.log('progress:', progress.percent);
            });
            Alert.popUp({
              caption: LANG.switch_version,
              message: LANG.downloading,
            });
            communicator.send(UpdateEvents.DownloadUpdate);
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
    const doCheck = storage.get('auto_check_update') && tabController.getIsFirstTab();

    if (doCheck) {
      checkForUpdate(true);
    }
  },
  checkForUpdate(): void {
    checkForUpdate(false);
  },
  switchVersion,
};
