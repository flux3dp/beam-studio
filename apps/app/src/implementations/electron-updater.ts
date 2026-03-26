import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import tabController from '@core/app/actions/tabController';
import alertConstants from '@core/app/constants/alert-constants';
import { UpdateEvents } from '@core/app/constants/ipcEvents';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';

const checkForUpdate = (isAutoCheck: boolean) => {
  const LANG = i18n.lang.update.software;

  if (!isAutoCheck) {
    progressCaller.openNonstopProgress({ id: 'electron-check-update', message: LANG.checking });
  }

  let hasGetResponse = false;

  communicator.send(UpdateEvents.CheckForUpdate);
  setTimeout(() => {
    if (!hasGetResponse) {
      if (!isAutoCheck) {
        progressCaller.popById('electron-check-update');
        alertCaller.popUp({
          caption: LANG.check_update,
          message: LANG.no_response,
        });
      }
    }
  }, 15000);
  communicator.once(
    UpdateEvents.UpdateAvailable,
    (_, res: { error?: { code?: any }; info?: { version: string }; isUpdateAvailable: boolean }) => {
      hasGetResponse = true;

      console.log('Check update response:', res);

      if (!isAutoCheck) {
        progressCaller.popById('electron-check-update');
      }

      if (res?.error || !res?.info) {
        console.log(res.error, res.info);

        if (!isAutoCheck) {
          alertCaller.popUp({
            caption: LANG.check_update,
            message: `#829 Error: ${res.error?.code}`,
          });
        }

        return;
      }

      const showNotFoundAlert = () => {
        if (!isAutoCheck) {
          alertCaller.popUp({
            caption: LANG.check_update,
            message: LANG.not_found,
          });
        }
      };

      if (!res.isUpdateAvailable) {
        showNotFoundAlert();

        return;
      }

      const { FLUX } = window;
      const [remoteVersion, remoteChannel = 'latest'] = res.info.version.split('-');
      const [currentVersion, currentChannel = 'latest'] = FLUX.version.split('-');

      if (currentChannel !== remoteChannel) {
        console.log(`Current Channel: ${currentChannel}, But got: ${remoteChannel}`);
        showNotFoundAlert();

        return;
      }

      if (remoteVersion === currentVersion) {
        if (currentChannel === 'alpha') {
          console.log('Update silently for alpha version');
          communicator.send(UpdateEvents.DownloadUpdate);
        } else {
          showNotFoundAlert();
        }

        return;
      }

      const msg = sprintf(LANG.available_update, res.info.version, FLUX.version);

      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        caption: LANG.check_update,
        message: msg,
        onNo: () => {
          communicator.once(UpdateEvents.UpdateDownloaded, () => {});
        },
        onYes: () => {
          communicator.once(UpdateEvents.UpdateDownloaded, (e: any, info: { version: any }) => {
            const downloadedMsg = `Beam Studio v${info.version} ${LANG.install_or_not}`;

            alertCaller.popUp({
              buttonType: alertConstants.YES_NO,
              caption: LANG.check_update,
              message: downloadedMsg,
              onYes: async () => {
                if (await toggleUnsavedChangedDialog()) {
                  communicator.send(UpdateEvents.QuitAndInstall);
                }
              },
            });
          });
          communicator.on(UpdateEvents.DownloadProgress, (e: any, progress: { percent: any }) => {
            console.log('progress:', progress.percent);
          });
          alertCaller.popUp({
            caption: LANG.check_update,
            message: LANG.downloading,
          });
          communicator.send(UpdateEvents.DownloadUpdate);
        },
      });
    },
  );
};

const switchVersion = (): void => {
  const LANG = i18n.lang.update.software;
  const { FLUX } = window;
  const currentChannel = FLUX.version.split('-')[1];

  progressCaller.openNonstopProgress({ id: 'electron-check-switch', message: LANG.checking });

  const targetChannel = currentChannel ? 'latest' : 'beta';

  communicator.send(UpdateEvents.CheckForUpdate, targetChannel);
  communicator.once(
    UpdateEvents.UpdateAvailable,
    (_, res: { error?: { code?: any }; info?: { version: string }; isUpdateAvailable: boolean }) => {
      progressCaller.popById('electron-check-switch');

      if (res.error || !res.info) {
        console.log(res.error, res.info);
        alertCaller.popUp({
          caption: LANG.switch_version,
          message: `#829 Error: ${res.error?.code}`,
        });

        return;
      }

      if (res.isUpdateAvailable) {
        const msg = sprintf(LANG.available_switch, res.info.version, FLUX.version);

        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          caption: LANG.switch_version,
          message: msg,
          onNo: () => {
            communicator.once(UpdateEvents.UpdateDownloaded, () => {});
          },
          onYes: () => {
            communicator.once(UpdateEvents.UpdateDownloaded, (e: any, info: { version: any }) => {
              const downloadedMsg = `Beam Studio v${info.version} ${LANG.switch_or_not}`;

              alertCaller.popUp({
                buttonType: alertConstants.YES_NO,
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
            alertCaller.popUp({
              caption: LANG.switch_version,
              message: LANG.downloading,
            });
            communicator.send(UpdateEvents.DownloadUpdate);
          },
        });
      } else {
        alertCaller.popUp({
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
