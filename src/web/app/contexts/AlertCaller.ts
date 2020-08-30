import { AlertsAndProgress, AlertsAndProgressContextCaller }  from '../views/dialogs/AlertsAndProgress'

export default {
    popUp: (args) => {
        if (!AlertsAndProgressContextCaller) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextCaller.popUp(args);
        }
    },
    popById: (id) => {
        if (!AlertsAndProgressContextCaller) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextCaller.popById(id);
        }
    },
    popUpDeviceBusy: (id) => {
        if (!AlertsAndProgressContextCaller) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextCaller.popUpDeviceBusy(id);
        }
    }
};