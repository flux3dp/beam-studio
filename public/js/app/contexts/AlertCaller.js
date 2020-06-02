define([
    'jsx!views/dialogs/Alert'
], function (
    Alert
) {
    return {
        popUp: (args) => {
            if (!Alert.AlertContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                Alert.AlertContextCaller.popUp(args);
            }
        },
        popAlertStackById: (id) => {
            if (!Alert.AlertContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                Alert.AlertContextCaller.popAlertStackById(id);
            }
        },
        popUpDeviceBusy: (id) => {
            if (!Alert.AlertContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                Alert.AlertContextCaller.popUpDeviceBusy(id);
            }
        }
    }
});