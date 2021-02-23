import * as i18n from './i18n';
import Config from './api/config';
import sprintf from './sprintf';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import Progress from '../app/actions/progress-caller';
import FileExportHelper from './file-export-helper';

const electron = window["electron"];
const LANG = i18n.lang.update.software;
const ipc = electron['ipc'];
const events = electron['events'];
const FLUX = window['FLUX'];

const checkForUpdate = (isAutoCheck) => {
    let currentChannel = FLUX.version.split('-')[1] || 'latest';
    if (!isAutoCheck) {
        Progress.openNonstopProgress({id: 'electron-check-update', message: LANG.checking});
    }
    let hasGetResponse = false;
    ipc.send(events.CHECK_FOR_UPDATE, currentChannel);
    setTimeout(() => {
        if (!hasGetResponse) {
            if (!isAutoCheck) {
                Progress.popById('electron-check-update');
                Alert.popUp({
                    message: LANG.no_response,
                    caption: LANG.check_update
                });
            }
        }
    }, 15000)
    ipc.once(events.UPDATE_AVAILABLE, (event, res) => {
        hasGetResponse = true;
        if (!isAutoCheck) {
            Progress.popById('electron-check-update');
        }
        if (res.error) {
            console.log(res.error);
            if (!isAutoCheck) {
                Alert.popUp({
                    message: `#829 Error: ${res.error.code} `,
                    caption: LANG.check_update
                });
            }
            return;
        }
        let channel = res.info.version.split('-')[1] || 'latest';
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
                    ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {
                        let msg = `Beam Studio v${info.version} ${LANG.install_or_not}`;
                        Alert.popUp({
                            buttonType: AlertConstants.YES_NO,
                            message: msg,
                            caption: LANG.check_update,
                            onYes: async () => {
                                const res = await FileExportHelper.toggleUnsavedChangedDialog();
                                if (res) ipc.send(events.QUIT_AND_INSTALL);
                            }
                        });
                    });
                    ipc.on(events.DOWNLOAD_PROGRESS, (event, progress) => {
                        console.log('progress:', progress.percent);
                    });
                    Alert.popUp({
                        message: LANG.downloading,
                        caption: LANG.check_update
                    });
                    ipc.send(events.DOWNLOAD_UPDATE);
                },
                onNo: () => {
                    ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {});
                }
            });
        } else {
            if (!isAutoCheck){
                Alert.popUp({
                    message: LANG.not_found,
                    caption: LANG.check_update
                });
            }
        }
    });
};

const switchVersion = () => {
    const currentChannel = FLUX.version.split('-')[1];
    Progress.openNonstopProgress({id: 'electron-check-switch', message: LANG.checking});
    const targetChannel = currentChannel ? 'latest' : 'beta';
    ipc.send(events.CHECK_FOR_UPDATE, targetChannel);
    ipc.once(events.UPDATE_AVAILABLE, (event, res) => {
        Progress.popById('electron-check-switch');
        if (res.error) {
            console.log(res.error);
            Alert.popUp({
                message: `#829 Error: ${res.error.code} `,
                caption: LANG.switch_version
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
                    ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {
                        let msg = `Beam Studio v${info.version} ${LANG.switch_or_not}`;
                        Alert.popUp({
                            buttonType: AlertConstants.YES_NO,
                            message: msg,
                            caption: LANG.switch_version,
                            onYes: async () => {
                                const res = await FileExportHelper.toggleUnsavedChangedDialog();
                                if (res) ipc.send(events.QUIT_AND_INSTALL);
                            }
                        });
                    });
                    ipc.on(events.DOWNLOAD_PROGRESS, (event, progress) => {
                        console.log('progress:', progress.percent);
                    });
                    Alert.popUp({
                        message: LANG.downloading,
                        caption: LANG.switch_version
                    });
                    ipc.send(events.DOWNLOAD_UPDATE);
                },
                onNo: () => {
                    ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {});
                }
            });
        } else {
            Alert.popUp({
                message: LANG.switch_version_not_found,
                caption: LANG.switch_version
            });
        }
    });
};

export default {
    checkForUpdate: function() {
        checkForUpdate(false);
    },

    autoCheck: function() {
        let isAutoCheck = Config().read('auto_check_update') === 1 || !Config().read('auto_check_update');
        if (isAutoCheck) {
            checkForUpdate(isAutoCheck);
        }
    },
    switchVersion
};
