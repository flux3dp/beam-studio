define([
    'helpers/i18n',
    'helpers/api/config',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/beambox/svgeditor-function-wrapper',
],function(
    i18n,
    Config,
    Alert,
    AlertConstants,
    ProgressActions,
    ProgressConstants,
    FnWrapper
){
    'use strict';
    const LANG = i18n.lang.update.software;
    let ipc = electron.ipc;
    let events = electron.events;

    //return true if v1 > v2
    const versionCompare = (v1, v2) => {
        if (!v1) {
            return false;
        }
        if (!v2) {
            return true;
        }
        v1 = v1.split('.');
        v2 = v2.split('.');
        for(let i = 0; i < Math.min(v1.length, v2.length); i++) {
            if (Number(v1[i]) > Number(v2[i])) {
                return true;
            } else if (Number(v1[i]) < Number(v2[i])) {
                return false;
            }
        }
        return false;
    }

    const checkForUpdate = (isAutoCheck) => {
        let currentChannel = FLUX.version.split('-')[1] || 'latest';
        ProgressActions.open(ProgressConstants.NONSTOP, LANG.checking);
        ipc.send(events.CHECK_FOR_UPDATE, currentChannel);
        ipc.once(events.UPDATE_AVAILABLE, (event, res) => {
            ProgressActions.close();
            if (res.error) {
                console.log(res.error);
                if (!isAutoCheck) {
                    Alert.popUp({
                        message: `Error: ${res.error.code} `,
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
                let msg = `Beam Studio v${res.info.version} ${LANG.available_update}`;
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
                                onYes: () => {FnWrapper.toggleUnsavedChangedDialog(() => {ipc.send(events.QUIT_AND_INSTALL)})}
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
        ProgressActions.open(ProgressConstants.NONSTOP, LANG.checking);
        const targetChannel = currentChannel ? 'latest' : 'beta';
        ipc.send(events.CHECK_FOR_UPDATE, targetChannel);
        ipc.once(events.UPDATE_AVAILABLE, (event, res) => {
            ProgressActions.close();
            if (res.error) {
                console.log(res.error);
                Alert.popUp({
                    message: `Error: ${res.error.code} `,
                    caption: LANG.switch_version
                });
                return;
            }
            if (res.isUpdateAvailable) {
                let msg = `Beam Studio v${res.info.version} ${LANG.available_switch}`;
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
                                onYes: () => {FnWrapper.toggleUnsavedChangedDialog(() => {ipc.send(events.QUIT_AND_INSTALL)})}
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

    return {
        checkForUpdate: function() {
            checkForUpdate(false);
        },

        autoCheck: function() {
            let isAutoCheck = Config().read('auto_check_update') === '1' || !Config().read('auto_check_update');
            if (isAutoCheck) {
                checkForUpdate(isAutoCheck);
            }
        },
        switchVersion
    }
});
