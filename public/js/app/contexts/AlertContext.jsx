define([
    'helpers/i18n',
    'app/constants/alert-constants'
], function (
    i18n,
    AlertConstants
) {
    const React = require('react');
    const { createContext } = React;
    const AlertContext = createContext();
    const LANG = i18n.lang.alert;

    class AlertContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                alertStack: []
            }
        }

        popAlertStack = () => {
            this.state.alertStack.pop();
            this.setState(this.state);
        };

        popAlertStackById = (id) => {
            this.state.alertStack = this.state.alertStack.filter((alert) => {return alert.id !== id});
            this.setState(this.state);
        };

        pushAlertToStack = (alert) => {
            if (alert.id) console.log(`alert id: ${alert.id} popped up`);
            this.state.alertStack.push(alert);
            this.setState(this.state);
        }

        popUp = (args) => {
            let {id, type, message, caption} = args;
            message = message || '';
            switch (type) {
                case AlertConstants.SHOW_POPUP_INFO:
                    caption = caption || LANG.info;
                    break;
                case AlertConstants.SHOW_POPUP_WARNING:
                    caption = caption || LANG.warning;
                    break;
                case AlertConstants.SHOW_POPUP_ERROR:
                    caption = caption || LANG.error;
                    break;
            }
            let {buttons, checkBox} = this.buttonsGenerator(args);
            let checkBoxText = checkBox ? checkBox.text : null;
            let checkBoxCallbacks = checkBox ? checkBox.callbacks : null;

            this.pushAlertToStack({
                id,
                caption,
                message,
                buttons,
                checkBoxText,
                checkBoxCallbacks
            });

        }

        buttonsGenerator = (args) => {
            let {id, buttons, buttonType, buttonLabels, checkBox, callbacks, primaryButtonIndex, onYes, onNo, onConfirm, onRetry, onCancel} = args;
            if (buttons) {
                return {buttons, checkBox};
            }

            switch(buttonType) {
                case AlertConstants.YES_NO:
                    onYes = onYes ? onYes : () => {};
                    onNo = onNo ? onNo : () => {};
                    buttonLabels = [LANG.yes, LANG.no];
                    callbacks = [onYes, onNo];
                    primaryButtonIndex = primaryButtonIndex || 0;
                    if (checkBox) {
                        const onCheckedYes = checkBox.onYes ? checkBox.onYes : () => {};
                        const onCheckedNo = checkBox.onNo ? checkBox.onNo : () => {};
                        checkBox.callbacks = [onCheckedYes, onCheckedNo];
                    }
                    break;
                case AlertConstants.YES_NO_CUSTOM:
                    onYes = onYes ? onYes : () => {};
                    onNo = onNo ? onNo : () => {};
                    primaryButtonIndex = primaryButtonIndex || 0;
                    if (!buttonLabels) {
                        buttonLabels = [LANG.yes, LANG.no];
                        callbacks = [onYes, onNo];
                        if (checkBox) {
                            const onCheckedYes = checkBox.onYes ? checkBox.onYes : () => {};
                            const onCheckedNo = checkBox.onNo ? checkBox.onNo : () => {};
                            checkBox.callbacks = [onCheckedYes, onCheckedNo];
                        }
                    } else if (typeof buttonLabels === 'string') {
                        buttonLabels = [LANG.yes, LANG.no, buttonLabels];
                        callbacks = callbacks ? callbacks : () => {};
                        callbacks = [onYes, onNo, callbacks];
                        
                    } else {
                        buttonLabels = [LANG.yes, LANG.no, ...buttonLabels];
                        callbacks = [onYes, onNo, ...callbacks];
                    }
                    break;
                case AlertConstants.CONFIRM_CANCEL:
                    onConfirm = onConfirm ? onConfirm : () => {};
                    onCancel = onCancel ? onCancel : () => {};
                    buttonLabels = [LANG.confirm, LANG.cancel];
                    primaryButtonIndex = primaryButtonIndex || 0;
                    callbacks = [onConfirm, onCancel];
                    if (checkBox) {
                        const onCheckedConfirm = checkBox.onConfirm ? checkBox.onConfirm : () => {};
                        const onCheckedCancel = checkBox.onCancel ? checkBox.onCancel : () => {};
                        checkBox.callbacks = [onCheckedConfirm, onCheckedCancel];
                    }
                    break;
                case AlertConstants.RETRY_CANCEL:
                    onRetry = onRetry ? onRetry : () => {};
                    onCancel = onCancel ? onCancel : () => {};
                    buttonLabels = [LANG.retry, LANG.cancel];
                    primaryButtonIndex = primaryButtonIndex || 0;
                    callbacks = [onRetry, onCancel];
                    if (checkBox) {
                        const onCheckedRetry = checkBox.onRetry ? checkBox.onRetry : () => {};
                        const onCheckedCancel = checkBox.onCancel ? checkBox.onCancel : () => {};
                        checkBox.callbacks = [onCheckedRetry, onCheckedCancel];
                    }
                    break;
                case AlertConstants.CUSTOM_CANCEL:
                    onCancel = onCancel ? onCancel : () => {};
                    primaryButtonIndex = primaryButtonIndex || 0;
                    if (!buttonLabels) {
                        buttonLabels = [LANG.cancel];
                        callbacks = [onCancel];
                        if (checkBox) {
                            const onCheckedCancel = checkBox.onCancel ? checkBox.onCancel : () => {};
                            checkBox.callbacks = [onCheckedCancel];
                        }
                    } else if (typeof buttonLabels === 'string') {
                        buttonLabels = [buttonLabels, LANG.cancel];
                        callbacks = callbacks ? callbacks : () => {};
                        callbacks = [callbacks, onCancel];
                        
                    } else {
                        buttonLabels = [...buttonLabels, LANG.cancel];
                        callbacks = [...callbacks, onCancel];
                    }
                    break;
                default:
                    if (!buttonLabels) {
                        buttonLabels = [LANG.ok];
                        callbacks = callbacks ? callbacks : () => {};
                        if (checkBox) {
                            if (!checkBox.callbacks) {
                                checkBox.callbacks = [() => {}];
                            } else if (typeof checkBox.callbacks === 'function') {
                                checkBox.callbacks = [checkBox.callbacks];
                            }
                        }
                    } else if (typeof buttonLabels === 'string') {
                        buttonLabels = [buttonLabels];
                        callbacks = callbacks ? callbacks : () => {};
                        if (checkBox) {
                            if (!checkBox.callbacks) {
                                checkBox.callbacks = [() => {}];
                            } else if (typeof checkBox.callbacks === 'function') {
                                checkBox.callbacks = [checkBox.callbacks];
                            }
                        }
                    }
                    break;
            }
            buttons = buttonLabels.map((label, i) => {
                let b = {
                    label,
                    className: (buttonLabels.length === 1 || i === primaryButtonIndex || primaryButtonIndex === undefined) ? 'btn-default primary' : 'btn-default'
                };
                if (callbacks && typeof callbacks === 'function') {
                    b.onClick = () => {
                        callbacks(id);
                    }
                } else if (callbacks && callbacks.length > i) {
                    b.onClick = () => {
                        callbacks[i](id);
                    }
                } else if (!callbacks) {
                    b.onClick = () => {};
                }
                return b;
            });

            return {buttons, checkBox};
        }

        popUpDeviceBusy= (id) => {
            this.popUp({
                id,
                message: i18n.lang.message.device_busy.message,
                caption: i18n.lang.message.device_busy.caption
            })
        }

        render() {
            const { alertStack } = this.state;
            const { 
                popAlertStack,
                popAlertStackById,
                popUp,
                pushAlertToStack, 
                popUpDeviceBusy,
            } = this;
            return (
                <AlertContext.Provider value={{
                    alertStack,
                    popAlertStack,
                    popAlertStackById,
                    popUp,
                    pushAlertToStack,
                    popUpDeviceBusy,
                }}>
                    {this.props.children}
                </AlertContext.Provider>
            );
        }
    };

    return {AlertContextProvider, AlertContext};
});