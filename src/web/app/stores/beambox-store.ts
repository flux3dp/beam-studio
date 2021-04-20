import Dispatcher from '../dispatcher/beambox-dispatcher';
import Constants from '../constants/beambox-constants';
const EventEmitter = requireNode('events');

var beamboxStore;

beamboxStore = Object.assign(EventEmitter.prototype, {

    onUpdateLaserPanel: function (callback) {
        this.on(Constants.UPDATE_LASER_PANEL, callback);
        return beamboxStore;
    },

    onEndDrawingPreviewBlob: function (callback) {
        this.on(Constants.END_DRAWING_PREVIEW_BLOB, callback);
        return beamboxStore;
    },

    onStartDrawingPreviewBlob: function (callback) {
        this.on(Constants.START_DRAWING_PREVIEW_BLOB, callback);
        return beamboxStore;
    },

    onCropperShown: function (callback) {
        this.on(Constants.SHOW_CROPPER, callback);
        return beamboxStore;
    },

    onEndImageTrace: function (callback) {
        this.on(Constants.END_IMAGE_TRACE, callback);
        return beamboxStore;
    },

    onClearCameraCanvas: function (callback) {
        this.on(Constants.CLEAR_CAMERA_CANVAS, callback);
        return beamboxStore;
    },

    onResetPreviewButton: function (callback) {
        this.on(Constants.RESET_PREVIEW_BUTTON, callback);
        return beamboxStore;
    },

    onShowTaskInterpreter: function (callback) {
        this.on(Constants.SHOW_TASK_INTERPRETER, callback);
        return beamboxStore;
    },

    onDrawGuideLines: function (callback) {
        this.on(Constants.DRAW_GUIDE_LINES, callback);
        return beamboxStore;
    },

    removeUpdateLaserPanelListener: function (callback) {
        this.removeListener(Constants.UPDATE_LASER_PANEL, callback);
        return beamboxStore;
    },

    removeAllUpdateLaserPanelListeners: function () {
        this.removeAllListeners(Constants.UPDATE_LASER_PANEL);
        return beamboxStore;
    },

    removeEndDrawingPreviewBlobListener: function (callback) {
        this.removeListener(Constants.END_DRAWING_PREVIEW_BLOB, callback);
        return beamboxStore;
    },

    removeStartDrawingPreviewBlobListener: function (callback) {
        this.removeListener(Constants.START_DRAWING_PREVIEW_BLOB, callback);
        return beamboxStore;
    },

    removeCropperShownListener: function (callback) {
        this.removeListener(Constants.SHOW_CROPPER, callback);
        return beamboxStore;
    },

    removeEndImageTraceListener: function (callback) {
        this.removeListener(Constants.END_IMAGE_TRACE, callback);
        return beamboxStore;
    },

    removeClearCameraCanvasListener: function (callback) {
        this.removeListener(Constants.CLEAR_CAMERA_CANVAS, callback);
        return beamboxStore;
    },

    removeResetPreviewButton: function (callback) {
        this.removeListener(Constants.RESET_PREVIEW_BUTTON, callback);
        return beamboxStore;
    },

    dispatcherIndex: Dispatcher.register(function (payload) {
        var actionType = payload.actionType;

        if (Constants[actionType]) {
            beamboxStore.emit(actionType, payload);
        }
        else {
            throw console.error(`unknown action type: ${actionType}`);
        }
    })
});

export default beamboxStore;
