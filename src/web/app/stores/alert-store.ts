import Dispatcher from '../dispatcher/alert-dispatcher';
import AlertConstants from '../constants/alert-constants';
const EventEmitter = requireNode('events');

var NOTIFY_EVENT            = 'notify',
    POPUP_EVENT             = 'popup',
    CLOSE_NOTIFICATION      = 'closeNotification',
    CLOSE_POPUP             = 'closePopup',
    UPDATE_EVENT            = 'update',
    CHANGE_FILAMENT_EVENT   = 'change_filament',
    EDIT_HEAD_TEMPERATURE   = 'edit_head_temperature',
    NOTIFY_RETRY            = 'retry',
    NOTIFY_ABORT            = 'abort',
    NOTIFY_YES              = 'yes',
    NOTIFY_NO               = 'no',
    NOTIFY_CANCEL           = 'cancel', // including the "no", "cancel", "ok" button fired
    NOTIFY_CUSTOM           = 'custom',
    NOTIFY_CUSTOM_GROUP     = 'customGroup',
    NOTIFY_ANSWER           = 'answer',
    AlertStore;

AlertStore = Object.assign(EventEmitter.prototype, {
    onShowHeadTemperature(callback) {
        this.on(EDIT_HEAD_TEMPERATURE, callback);
    },

    onUpdate(callback) {
        this.on(UPDATE_EVENT, callback);
    },

    onNotify(callback) {
        this.on(NOTIFY_EVENT, callback);
    },

    onPopup(callback) {
        this.on(POPUP_EVENT, callback);
    },

    onRetry(callback) {
        this.on(NOTIFY_RETRY, callback);
    },

    onYes(callback, oneTime) {
        oneTime === true ? this.once(NOTIFY_YES, callback) : this.on(NOTIFY_YES, callback);
    },

    onNo(callback, oneTime) {
        oneTime === true ? this.once(NOTIFY_NO, callback) : this.on(NOTIFY_NO, callback);
    },

    onCancel(callback, oneTime) {
        oneTime === true ? this.once(NOTIFY_CANCEL, callback) : this.on(NOTIFY_CANCEL, callback);
    },

    onAbort(callback) {
        this.on(NOTIFY_ABORT, callback);
    },

    onCustom(callback, oneTime) {
        oneTime === true ? this.once(NOTIFY_CUSTOM, callback) : this.on(NOTIFY_CUSTOM, callback);
    },

    onCustomGroup(callback, oneTime) {
        oneTime === true ? this.once(NOTIFY_CUSTOM_GROUP, callback) : this.on(NOTIFY_CUSTOM_GROUP, callback);
    },

    onAnswer(callback) {
        this.on(NOTIFY_ANSWER, callback);
    },

    onCloseNotify(callback) {
        this.on(CLOSE_NOTIFICATION, callback);
    },

    onClosePopup(callback) {
        this.on(CLOSE_POPUP, callback);
    },

    removeNotifyListener(callback) {
        this.removeListener(NOTIFY_EVENT, callback);
    },

    removePopupListener(callback) {
        this.removeListener(POPUP_EVENT, callback);
    },

    removeCloseNotifyListener(callback) {
        this.removeListener(CLOSE_NOTIFICATION, callback);
    },

    removeClosePopupListener(callback) {
        this.removeListener(CLOSE_POPUP, callback);
    },

    removeRetryListener(callback) {
        this.removeListener(NOTIFY_RETRY, callback);
    },

    removeAbortListener(callback) {
        this.removeListener(NOTIFY_ABORT, callback);
    },

    removeYesListener(callback) {
        this.removeListener(NOTIFY_YES, callback);
    },

    removeNoListener(callback) {
        this.removeListener(NOTIFY_NO, callback);
    },

    removeCancelListener(callback) {
        this.removeListener(NOTIFY_CANCEL, callback);
    },

    removeCustomListener(callback) {
        this.removeListener(NOTIFY_CUSTOM, callback);
    },

    dispatcherIndex: Dispatcher.register(function(payload) {
        var actionType = payload.actionType,
            action = {

            'SHOW_INFO': function() {
                AlertStore.emit(NOTIFY_EVENT, AlertConstants.INFO, payload.message, payload.callback);
            },

            'SHOW_WARNING': function() {
                AlertStore.emit(NOTIFY_EVENT, AlertConstants.WARNING, payload.message, payload.onClickCallback, payload.fixed);
            },

            'SHOW_ERROR': function() {
                AlertStore.emit(NOTIFY_EVENT, AlertConstants.ERROR, payload.message);
            },

            'SHOW_POPUP_INFO': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.INFO, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_WARNING': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.WARNING, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_CHECKBOX_WARNING': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.WARNING_WITH_CHECKBOX, payload.id, payload.caption, payload.message, payload.checkbox, payload.args);
            },

            'SHOW_POPUP_ERROR': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.ERROR, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_DEVICE_BUSY': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.ERROR, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_RETRY': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.RETRY_CANCEL, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_RETRY_ABORT': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.RETRY_ABORT_CANCEL, payload.id, payload.caption, payload.message);
            },

            'SHOW_POPUP_YES_NO': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.YES_NO, payload.id, payload.caption, payload.message, '', payload.args);
            },

            'SHOW_POPUP_CUSTOM': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.CUSTOM, payload.id, payload.caption, payload.message, payload.customText, payload.args);
            },

            'SHOW_POPUP_CUSTOM_GROUP': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.CUSTOM_GROUP, payload.id, payload.caption, payload.message, payload.customText, payload.args, payload.callback);
            },

            'SHOW_POPUP_CUSTOM_CANCEL': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.CUSTOM_CANCEL, payload.id, payload.caption, payload.message, payload.customText);
            },

            'SHOW_POPUP_QUESTION': function() {
                AlertStore.emit(POPUP_EVENT, AlertConstants.QUESTION, payload.id, payload.caption, payload.message);
            },

            'SHOW_HEAD_TEMPERATURE': function() {
                AlertStore.emit(EDIT_HEAD_TEMPERATURE, payload);
            },

            'NOTIFY_RETRY': function() {
                AlertStore.emit(NOTIFY_RETRY, payload.id);
            },

            'NOTIFY_ABORT': function() {
                AlertStore.emit(NOTIFY_ABORT, payload.id);
            },

            'NOTIFY_YES': function() {
                AlertStore.emit(NOTIFY_YES, payload.id, payload.args);
            },

            'NOTIFY_NO': function() {
                AlertStore.emit(NOTIFY_NO, payload.id);
            },

            'NOTIFY_CANCEL': function() {
                AlertStore.emit(NOTIFY_CANCEL, payload.id);
            },

            'NOTIFY_CUSTOM': function() {
                AlertStore.emit(NOTIFY_CUSTOM, payload.id);
            },

            'NOTIFY_CUSTOM_GROUP': function() {
                AlertStore.emit(NOTIFY_CUSTOM_GROUP, payload.id);
            },

            'NOTIFY_ANSWER': function() {
                AlertStore.emit(NOTIFY_ANSWER, payload.id, payload.isYes);
            },

            'SHOW_POPUP_UPDATE': function() {
                AlertStore.emit(UPDATE_EVENT, payload);
            },

            'CLOSE_NOTIFICATION': function() {
                AlertStore.emit(CLOSE_NOTIFICATION);
            },

            'CLOSE_POPUP': function() {
                AlertStore.emit(CLOSE_POPUP);
            },

            'SHOW_POPUP_CHANGE_FILAMENT': function() {
                AlertStore.emit(CHANGE_FILAMENT_EVENT, payload);
            }
        };

        if(!!action[actionType]) {
            action[actionType]();
        }
    })

});

export default AlertStore;
