import ProgressConstants from '../constants/progress-constants'
import { AlertsAndProgressContextCaller } from '../views/dialogs/AlertsAndProgress'
export default {
        openNonstopProgress: (args) => {
            if (!AlertsAndProgressContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                args.type = ProgressConstants.NONSTOP;
                if (!args.caption && args.message) {
                    args.caption = args.message;
                }
                AlertsAndProgressContextCaller.openProgress(args);
            }
        },
        openSteppingProgress: (args) => {
            if (!AlertsAndProgressContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                args.type = ProgressConstants.STEPPING;
                args.percentage = args.percentage || 0;
                AlertsAndProgressContextCaller.openProgress(args);
            }
        },
        popById: (id) => {
            if (!AlertsAndProgressContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgressContextCaller.popById(id);
            }
        },
        popLastProgress: () => {
            if (!AlertsAndProgressContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgressContextCaller.popLastProgress();
            }
        },
        update: (id, args) => {
            if (!AlertsAndProgressContextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgressContextCaller.updateProgress(id, args);
            }
        }
    };