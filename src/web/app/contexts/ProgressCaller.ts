define([
    'app/constants/progress-constants',
    'jsx!views/dialogs/AlertsAndProgress'
], function (
    ProgressConstants,
    AlertsAndProgress
) {
    return {
        openNonstopProgress: (args) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                args.type = ProgressConstants.NONSTOP;
                if (!args.caption && args.message) {
                    args.caption = args.message;
                }
                AlertsAndProgress.contextCaller.openProgress(args);
            }
        },
        openSteppingProgress: (args) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                args.type = ProgressConstants.STEPPING;
                args.percentage = args.percentage || 0;
                AlertsAndProgress.contextCaller.openProgress(args);
            }
        },
        popById: (id) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.popById(id);
            }
        },
        popLastProgress: () => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.popLastProgress();
            }
        },
        update: (id, args) => {
            if (!AlertsAndProgress.contextCaller) {
                console.log('Alert context not loaded Yet');
            } else {
                AlertsAndProgress.contextCaller.updateProgress(id, args);
            }
        }
    }
});