import InputLightboxConstants from '../constants/input-lightbox-constants';
import InputLightboxDispatcher from '../dispatcher/input-lightbox-dispatcher';

export default {
    open: function(id, args) {
        args = args || {};
        InputLightboxDispatcher.dispatch({
            id           : id,
            actionType   : InputLightboxConstants.OPEN_EVENT,
            type         : args.type,
            caption      : args.caption,
            inputHeader  : args.inputHeader,
            defaultValue : args.defaultValue,
            maxLength    : args.maxLength,
            confirmText  : args.confirmText,
            onClose      : args.onClose,
            onSubmit     : args.onSubmit
        });
    }
};
