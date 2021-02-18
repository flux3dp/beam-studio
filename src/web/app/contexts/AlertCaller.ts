import { AlertsAndProgress, AlertsAndProgressContextHelper }  from '../views/dialogs/Alerts-And-Progress';
import i18n from 'helpers/i18n';

const popUp = (args) => {
    if (!AlertsAndProgressContextHelper.context) {
        console.log('Alert context not loaded Yet');
    } else {
        AlertsAndProgressContextHelper.context.popUp(args);
    }
};

const popById = (id: string) => {
    if (!AlertsAndProgressContextHelper.context) {
        console.log('Alert context not loaded Yet');
    } else {
        AlertsAndProgressContextHelper.context.popById(id);
    }
};

export default {
    popUp,
    popById,
};
