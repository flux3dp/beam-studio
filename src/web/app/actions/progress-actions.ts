import ProgressConstants from '../constants/progress-constants';
import ProgressDispatcher from '../dispatcher/progress-dispatcher';

export default {
    open: function(type, caption?: string, message?: string, hasStop?: boolean, onFinished?: Function, onOpened?: Function, onStop?: Function) {
        ProgressDispatcher.dispatch({
            actionType: ProgressConstants.OPEN_EVENT,
            type: type,
            caption: caption,
            message: message,
            hasStop: hasStop,
            onFinished: onFinished,
            onOpened: onOpened,
            onStop: onStop
        });
    },

    updating: function(message: string, percentage: number, onStop?: Function) {
        ProgressDispatcher.dispatch({
            actionType: ProgressConstants.UPDATE_EVENT,
            message: message,
            percentage: percentage,
            onStop: onStop
        });
    },

    close: function() {
        ProgressDispatcher.dispatch({
            actionType: ProgressConstants.FINISH_EVENT
        });
    }
};
