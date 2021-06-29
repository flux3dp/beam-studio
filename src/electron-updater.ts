/* eslint-disable no-console */
import { sprintf } from 'sprintf-js';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import communicator from 'implementations/communicator';
import FileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import Progress from 'app/actions/progress-caller';
import storage from 'implementations/storage';

const { FLUX } = window;
const LANG = i18n.lang.update.software;

const checkForUpdate = (isAutoCheck) => {
  const currentChannel = FLUX.version.split('-')[1] || 'latest';
  if (!isAutoCheck) {
    Progress.openNonstopProgress({ id: 'electron-check-update', message: LANG.checking });
  }
  let hasGetResponse = false;
  communicator.send('CHECK_FOR_UPDATE', currentChannel);
  setTimeout(() => {
    if (!hasGetResponse) {
      if (!isAutoCheck) {
        Progress.popById('electron-check-update');
        Alert.popUp({
          message: LANG.no_response,
          caption: LANG.check_update,
        });
      }
    }
  }, 15000);
  communicator.once('UPDATE_AVAILABLE', (event, res) => {
    hasGetResponse = true;
    if (!isAutoCheck) {
      Progress.popById('electron-check-update');
    }
    if (res.error) {
      console.log(res.error);
      if (!isAutoCheck) {
        Alert.popUp({
          message: `#829 Error: ${res.error.code} `,
          caption: LANG.check_update,
        });
      }
      return;
    }
    const channel = res.info.version.split('-')[1] || 'latest';
    if (currentChannel !== channel) {
      console.log(`Current Channel: ${currentChannel}, But got: ${channel}`);
    }

    if (res.isUpdateAvailable && channel === currentChannel) {
      const msg = sprintf(LANG.available_update, res.info.version, FLUX.version);
      Alert.popUp({
        message: msg,
        caption: LANG.check_update,
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          communicator.once('UPDATE_DOWNLOADED', (e, info) => {
            const downloadedMsg = `Beam Studio v${info.version} ${LANG.install_or_not}`;
            Alert.popUp({
              buttonType: AlertConstants.YES_NO,
              message: downloadedMsg,
              caption: LANG.check_update,
              onYes: async () => {
                const unsavedDialogRes = await FileExportHelper.toggleUnsavedChangedDialog();
                if (unsavedDialogRes) communicator.send('QUIT_AND_INSTALL');
              },
            });
          });
          communicator.on('DOWNLOAD_PROGRESS', (e, progress) => {
            console.log('progress:', progress.percent);
          });
          Alert.popUp({
            message: LANG.downloading,
            caption: LANG.check_update,
          });
          communicator.send('DOWNLOAD_UPDATE');
        },
        onNo: () => {
          communicator.once('UPDATE_DOWNLOADED', () => { });
        },
      });
    } else if (!isAutoCheck) {
      Alert.popUp({
        message: LANG.not_found,
        caption: LANG.check_update,
      });
    }
  });
};

const switchVersion = (): void => {
  const currentChannel = FLUX.version.split('-')[1];
  Progress.openNonstopProgress({ id: 'electron-check-switch', message: LANG.checking });
  const targetChannel = currentChannel ? 'latest' : 'beta';
  communicator.send('CHECK_FOR_UPDATE', targetChannel);
  communicator.once('UPDATE_AVAILABLE', (event, res) => {
    Progress.popById('electron-check-switch');
    if (res.error) {
      console.log(res.error);
      Alert.popUp({
        message: `#829 Error: ${res.error.code} `,
        caption: LANG.switch_version,
      });
      return;
    }
    if (res.isUpdateAvailable) {
      const msg = sprintf(LANG.available_switch, res.info.version, FLUX.version);
      Alert.popUp({
        message: msg,
        caption: LANG.switch_version,
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          communicator.once('UPDATE_DOWNLOADED', (e, info) => {
            const downloadedMsg = `Beam Studio v${info.version} ${LANG.switch_or_not}`;
            Alert.popUp({
              buttonType: AlertConstants.YES_NO,
              message: downloadedMsg,
              caption: LANG.switch_version,
              onYes: async () => {
                const unsavedDialogRes = await FileExportHelper.toggleUnsavedChangedDialog();
                if (unsavedDialogRes) communicator.send('QUIT_AND_INSTALL');
              },
            });
          });
          communicator.on('DOWNLOAD_PROGRESS', (e, progress) => {
            console.log('progress:', progress.percent);
          });
          Alert.popUp({
            message: LANG.downloading,
            caption: LANG.switch_version,
          });
          communicator.send('DOWNLOAD_UPDATE');
        },
        onNo: () => {
          communicator.once('UPDATE_DOWNLOADED', () => { });
        },
      });
    } else {
      Alert.popUp({
        message: LANG.switch_version_not_found,
        caption: LANG.switch_version,
      });
    }
  });
};

export default {
  checkForUpdate(): void {
    checkForUpdate(false);
  },
  autoCheck(): void {
    const doCheck = storage.get('auto_check_update') !== 0;
    if (doCheck) {
      checkForUpdate(true);
    }
  },
  switchVersion,
};
