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

    const checkForUpdate = (isAutoCheck) => {
        let version = Config().read('update_version') || 'latest';
        ProgressActions.open(ProgressConstants.NONSTOP, LANG.checking);
            ipc.send(events.CHECK_FOR_UPDATE, version);
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
                } else if (res.isUpdateAvailable) {
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
                            ipc.once(events.DOWNLOAD_PROGRESS, (event, progress) => {
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

    return {
        checkForUpdate: function() {
            checkForUpdate(false);
        },

        autoCheck: function() {
            let isAutoCheck = Config().read('auto_check_update') === '1' || !Config().read('auto_check_update');
            if (isAutoCheck) {
                checkForUpdate(isAutoCheck);
            }
        }
    }
});
