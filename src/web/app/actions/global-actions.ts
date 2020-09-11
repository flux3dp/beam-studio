import GlobalConstants from '../constants/global-constants';
import Dispatcher from '../dispatcher/global-dispatcher';
export default {
    showMonitor: function(printer: any, fcode?: any, previewUrl?: string, opener?: string) {
        Dispatcher.dispatch({
            actionType: GlobalConstants.SHOW_MONITOR, printer, fcode, previewUrl, opener
        });
    },

    closeMonitor: function() {
        Dispatcher.dispatch({
            actionType: GlobalConstants.CLOSE_MONITOR
        });
    },

    closeAllView: function() {
        Dispatcher.dispatch({
            actionType: GlobalConstants.CLOSE_ALL_VIEW
        });
    },

    cancelPreview: function() {
        Dispatcher.dispatch({
            actionType: GlobalConstants.CANCEL_PREVIEW
        });
    },

    sliceComplete: function(report) {
        Dispatcher.dispatch({
            actionType: GlobalConstants.SLICE_COMPLETE, report
        });
    },

    monitorClosed: function() {
        Dispatcher.dispatch({
            actionType: GlobalConstants.MONITOR_CLOSED
        });
    },

    resetDialogMenuIndex: function() {
        Dispatcher.dispatch({
            actionType: GlobalConstants.RESET_DIALOG_MENU_INDEX
        });
    }
};
