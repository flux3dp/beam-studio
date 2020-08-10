define([
    'jsx!views/dialogs/AlertsAndProgress'
], function (
    AlertsAndProgress
) {
    return {
        popUp: (args) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.popUp(args);
            }
        },
        popById: (id) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.popById(id);
            }
        },
        popUpDeviceBusy: (id) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.popUpDeviceBusy(id);
            }
        }
    }
});