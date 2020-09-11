import AlertConstants from '../constants/alert-constants';
import AlertDispatcher from '../dispatcher/alert-dispatcher';
import AlertStore from '../stores/alert-store';
import * as i18n from '../../helpers/i18n';

var lang = i18n.lang;

export default {
    showInfo: function(message, callback) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_INFO, message, callback
        });
    },

    showWarning: function(message, onClickCallback, fixed) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_WARNING, message, onClickCallback, fixed
        });
    },

    showError: function(message) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_ERROR, message
        });
    },

    showDeviceBusyPopup: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_DEVICE_BUSY,
            caption: lang.message.device_busy.caption,
            message: lang.message.device_busy.message,
            id: id
        });
    },

    showPopupInfo: function(id, message, caption?: string) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_INFO, caption, message, id
        });
    },

    showPopupWarning: function(id, message, caption) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_WARNING, caption, message, id
        });
    },

    showPopupCheckboxWarning: function(id, message, caption, checkbox, args) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_CHECKBOX_WARNING, caption, message, id, checkbox, args
        });
    },

    showPopupError: function(id, message: string, caption?: string) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_ERROR, caption, message, id
        });
    },

    showPopupRetry: function(id, message, caption?: string) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_RETRY, caption, message, id
        });
    },

    showPopupRetryAbort: function(id, message, caption) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_RETRY_ABORT, caption, message, id
        });
    },

    showPopupYesNo: function(id, message: string, caption?: string, args?: any, callback?: {yes: Function, no: Function}) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_YES_NO, caption, message, id, args
        });
        // Make one time listener
        if (callback) {
            AlertStore.onYes(callback.yes, true);
            AlertStore.onCancel(callback.no, true);
        }
    },

    showPopupCustom: function(id, message, customText, caption, args, callback) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_CUSTOM,
            id: id,
            caption: caption,
            message: message,
            customText: customText,
            args: args
        });
        if (callback) {
            AlertStore.onCustom(callback, true);
        }
    },

    showPopupCustomGroup: function(id, message, customText, caption, args, callback) {
        callback = callback ? callback : ()=>{};
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_CUSTOM_GROUP,
            id: id,
            caption: caption,
            message: message,
            customText: customText,
            args: args,
            callback: callback
        });
    },

    showPopupCustomCancel: function(id, message, customText, caption, callback) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_CUSTOM_CANCEL,
            id: id,
            caption: caption,
            message: message,
            customText: customText
        });
        if (callback) {
            AlertStore.onCustom(callback.custom, true);
            AlertStore.onCancel(callback.no, true);
        }
    },

    showPopupQuestion: function(id, message, caption) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_QUESTION, caption, message, id
        });
    },

    showUpdate: function(device, type, updateInfo, onDownload, onInstall) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_UPDATE,
            device: device,
            type: type,
            updateInfo: updateInfo,
            onDownload: onDownload,
            onInstall: onInstall
        });
    },

    showChangeFilament: function(device, src) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_POPUP_CHANGE_FILAMENT,
            device: device,
            src: src || ''
        });
    },

    showHeadTemperature: function(device) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.SHOW_HEAD_TEMPERATURE,
            device: device
        });
    },

    notifyRetry: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_RETRY, id
        });
    },

    notifyAbort: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_ABORT, id
        });
    },

    notifyYes: function(id, args) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_YES, id, args
        });
    },

    notifyCancel: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_CANCEL, id
        });
    },

    notifyCustom: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_CUSTOM, id
        });
    },

    notifyCustomGroup: function(id) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_CUSTOM_GROUP, id
        });

    },

    notifyAnswer: function(id, isYes) {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.NOTIFY_ANSWER, id, isYes
        });
    },

    closeNotification: function() {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.CLOSE_NOTIFICATION
        });
    },

    closePopup: function() {
        AlertDispatcher.dispatch({
            actionType: AlertConstants.CLOSE_POPUP
        });
    }
};
