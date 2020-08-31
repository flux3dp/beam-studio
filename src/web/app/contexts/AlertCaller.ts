import { AlertsAndProgress, AlertsAndProgressContextHelper }  from '../views/dialogs/AlertsAndProgress'

export default {
    popUp: (args) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popUp(args);
        }
    },
    popById: (id) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popById(id);
        }
    },
    popUpDeviceBusy: (id) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popUpDeviceBusy(id);
        }
    }
};