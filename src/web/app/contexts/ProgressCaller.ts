import ProgressConstants from '../constants/progress-constants';
import { AlertsAndProgressContextHelper } from '../views/dialogs/AlertsAndProgress';
export default {
    openNonstopProgress: (args) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            args.type = ProgressConstants.NONSTOP;
            if (!args.caption && args.message) {
                args.caption = args.message;
            }
            AlertsAndProgressContextHelper.context.openProgress(args);
        }
    },
    openSteppingProgress: (args) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            args.type = ProgressConstants.STEPPING;
            args.percentage = args.percentage || 0;
            AlertsAndProgressContextHelper.context.openProgress(args);
        }
    },
    popById: (id) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popById(id);
        }
    },
    popLastProgress: () => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popLastProgress();
        }
    },
    update: (id, args) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.updateProgress(id, args);
        }
    }
};