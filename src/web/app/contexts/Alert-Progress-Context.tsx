import { IProgress } from 'app/views/dialogs/Alerts-And-Progress';
import { IAlert } from 'interfaces/IAlert';
import * as i18n from '../../helpers/i18n';
import AlertConstants from '../constants/alert-constants';
import ProgressConstants from '../constants/progress-constants';

const React = requireNode('react');
const { createContext } = React;
const LANG = i18n.lang.alert;
let progressID = 0;

export const AlertProgressContext = createContext();

export class AlertProgressContextProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertProgressStack: []
        }
    }

    popFromStack = () => {
        this.state.alertProgressStack.pop();
        this.setState(this.state);
    }

    popById = (id: string) => {
        this.state.alertProgressStack = this.state.alertProgressStack.filter((alertAndProgress) => {return alertAndProgress.id !== id});
        this.setState(this.state);
    }

    checkIdExist = (id: string, isProgress: boolean = false) => {
        const res = this.state.alertProgressStack.filter((alertAndProgress) => {
            return alertAndProgress.id === id && !!alertAndProgress.isProgress === isProgress;
        });
        return res.length > 0;
    }

    pushToStack = (elem) => {
        if (elem.id) {
            console.log('alert/progress poped', elem.id);
        }
        this.state.alertProgressStack.push(elem);
        this.setState(this.state);
    }

    openProgress = (args) => {
        let {id, type, message, caption} = args;
        if (!id) {
            id = `progress_${progressID}`;
            progressID = (progressID + 1) % 100000;
        }
        message = message || '';
        caption = caption || '';

        this.pushToStack({
            ...args,
            id,
            type,
            caption,
            message,
            isProgrss: true,
        });
    }

    popLastProgress = () => {
        const { alertProgressStack } = this.state;
        let i;
        for (i = alertProgressStack.length -1; i >= 0; i--) {
            if (alertProgressStack[i].isProgrss) {
                break;
            }
        }
        if (i >= 0) {
            alertProgressStack.splice(i, 1);
            this.setState({alertProgressStack});
        }
    }

    updateProgress = (id, args: IProgress = {}) => {
        const { alertProgressStack } = this.state;
        const targetObjects = alertProgressStack.filter((alertOrProgress) => {
            return alertOrProgress.isProgrss && alertOrProgress.id === id
        });
        if (targetObjects.length === 0) {
            return;
        }
        const targetObject = targetObjects[targetObjects.length - 1];
        if (targetObject.type === ProgressConstants.NONSTOP && !args.caption && args.message) {
            args.caption = args.message;
        }
        Object.assign(targetObject, args);
        this.setState({alertProgressStack});
    }

    popUp = (args: IAlert) => {
        let { type, message, caption } = args;
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
        let { buttons, checkbox } = this.buttonsGenerator(args);
        let checkboxText = checkbox ? checkbox.text : null;
        let checkboxCallbacks = checkbox ? checkbox.callbacks : null;

        this.pushToStack({
            ...args,
            caption,
            message,
            buttons,
            checkboxText,
            checkboxCallbacks
        });
    }

    buttonsGenerator = (args) => {
        let {id, buttons, buttonType, buttonLabels, checkbox, callbacks, primaryButtonIndex, onYes, onNo, onConfirm, onRetry, onCancel} = args;
        if (buttons) {
            return {buttons, checkbox};
        }

        switch(buttonType) {
            case AlertConstants.YES_NO:
                onYes = onYes ? onYes : () => {};
                onNo = onNo ? onNo : () => {};
                buttonLabels = [LANG.yes, LANG.no];
                callbacks = [onYes, onNo];
                primaryButtonIndex = primaryButtonIndex || 0;
                if (checkbox) {
                    const onCheckedYes = checkbox.onYes ? checkbox.onYes : () => {};
                    const onCheckedNo = checkbox.onNo ? checkbox.onNo : () => {};
                    checkbox.callbacks = [onCheckedYes, onCheckedNo];
                }
                break;
            case AlertConstants.YES_NO_CUSTOM:
                onYes = onYes ? onYes : () => {};
                onNo = onNo ? onNo : () => {};
                primaryButtonIndex = primaryButtonIndex || 0;
                if (!buttonLabels) {
                    buttonLabels = [LANG.yes, LANG.no];
                    callbacks = [onYes, onNo];
                    if (checkbox) {
                        const onCheckedYes = checkbox.onYes ? checkbox.onYes : () => {};
                        const onCheckedNo = checkbox.onNo ? checkbox.onNo : () => {};
                        checkbox.callbacks = [onCheckedYes, onCheckedNo];
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
                if (checkbox) {
                    const onCheckedConfirm = checkbox.onConfirm ? checkbox.onConfirm : () => {};
                    const onCheckedCancel = checkbox.onCancel ? checkbox.onCancel : () => {};
                    checkbox.callbacks = [onCheckedConfirm, onCheckedCancel];
                }
                break;
            case AlertConstants.RETRY_CANCEL:
                onRetry = onRetry ? onRetry : () => {};
                onCancel = onCancel ? onCancel : () => {};
                buttonLabels = [LANG.retry, LANG.cancel];
                primaryButtonIndex = primaryButtonIndex || 0;
                callbacks = [onRetry, onCancel];
                if (checkbox) {
                    const onCheckedRetry = checkbox.onRetry ? checkbox.onRetry : () => {};
                    const onCheckedCancel = checkbox.onCancel ? checkbox.onCancel : () => {};
                    checkbox.callbacks = [onCheckedRetry, onCheckedCancel];
                }
                break;
            case AlertConstants.CUSTOM_CANCEL:
                onCancel = onCancel ? onCancel : () => {};
                primaryButtonIndex = primaryButtonIndex || 0;
                if (!buttonLabels) {
                    buttonLabels = [LANG.cancel];
                    callbacks = [onCancel];
                    if (checkbox) {
                        const onCheckedCancel = checkbox.onCancel ? checkbox.onCancel : () => {};
                        checkbox.callbacks = [onCheckedCancel];
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
                    if (checkbox) {
                        if (!checkbox.callbacks) {
                            checkbox.callbacks = [() => {}];
                        } else if (typeof checkbox.callbacks === 'function') {
                            checkbox.callbacks = [checkbox.callbacks];
                        }
                    }
                } else if (typeof buttonLabels === 'string') {
                    buttonLabels = [buttonLabels];
                    callbacks = callbacks ? callbacks : () => {};
                    if (checkbox) {
                        if (!checkbox.callbacks) {
                            checkbox.callbacks = [() => {}];
                        } else if (typeof checkbox.callbacks === 'function') {
                            checkbox.callbacks = [checkbox.callbacks];
                        }
                    }
                }
                break;
        }
        buttons = buttonLabels.map((label, i) => {
            let b = {
                label,
                className: (buttonLabels.length === 1 || i === primaryButtonIndex || primaryButtonIndex === undefined) ? 'btn-default primary' : 'btn-default',
                onClick: () => {}
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

        return {buttons, checkbox};
    }

    render() {
        const { alertProgressStack } = this.state;
        const { 
            popFromStack,
            popById,
            checkIdExist,
            popUp,
            openProgress,
            updateProgress,
            popLastProgress,
            pushToStack, 
        } = this;
        return (
            <AlertProgressContext.Provider value={{
                alertProgressStack,
                popFromStack,
                popById,
                checkIdExist,
                popUp,
                openProgress,
                updateProgress,
                popLastProgress,
                pushToStack,
            }}>
                {this.props.children}
            </AlertProgressContext.Provider>
        );
    }
};
