define([
    'helpers/i18n',
    'helpers/api/config',
    'app/actions/alert-actions',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/beambox/svgeditor-function-wrapper',
],function(
    i18n,
    Config,
    AlertActions,
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
                        AlertActions.showPopupInfo('update-check-error', `Error: ${res.error.code} `, LANG.check_update);
                    }
                } else if (res.isUpdateAvailable) {
                    let msg = `Beam Studio v${res.info.version} ${LANG.available_update}`;
                    AlertActions.showPopupCustomGroup('updateavailable', msg, [LANG.no, LANG.yes], LANG.check_update, null, [
                        () => {
                            ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {});
                        },
                        () => {
                            ipc.once(events.UPDATE_DOWNLOADED, (event, info) => {
                                let msg = `Beam Studio v${info.version} ${LANG.install_or_not}`;
                                AlertActions.showPopupCustomGroup('update-downloaded', msg, [LANG.no, LANG.yes], LANG.check_update, null, [
                                    () => {},
                                    () => {FnWrapper.toggleUnsavedChangedDialog(() => {ipc.send(events.QUIT_AND_INSTALL)})}
                                ]);
                            });
                            ipc.once(events.DOWNLOAD_PROGRESS, (event, progress) => {
                                console.log('progress:', progress.percent);
                            });
                            AlertActions.showPopupInfo('download-update', LANG.downloading, LANG.check_update);
                            ipc.send(events.DOWNLOAD_UPDATE);
                        }
                    ]);
                } else {
                    if (!isAutoCheck){
                        AlertActions.showPopupInfo('update-unavailable', LANG.not_found, LANG.check_update);
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
