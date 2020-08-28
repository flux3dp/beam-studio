function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'app/constants/alert-constants'], function (i18n, AlertConstants) {
  const React = require('react');

  const {
    createContext
  } = React;
  const AlertProgressContext = createContext();
  const LANG = i18n.lang.alert;

  class AlertProgressContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "popFromStack", () => {
        this.state.alertProgressStack.pop();
        this.setState(this.state);
      });

      _defineProperty(this, "popById", id => {
        this.state.alertProgressStack = this.state.alertProgressStack.filter(alert => {
          return alert.id !== id;
        });
        this.setState(this.state);
      });

      _defineProperty(this, "pushToStack", elem => {
        if (elem.id) console.log(`alert/progress id: ${elem.id} popped up`);
        this.state.alertProgressStack.push(elem);
        this.setState(this.state);
      });

      _defineProperty(this, "openProgress", args => {
        let {
          id,
          type,
          message,
          caption
        } = args;
        message = message || '';
        caption = caption || '';
        this.pushToStack({
          id,
          type,
          caption,
          message,
          isProgrss: true
        });
      });

      _defineProperty(this, "popLastProgress", () => {
        const {
          alertProgressStack
        } = this.state;
        let i;

        for (i = alertProgressStack.length - 1; i >= 0; i--) {
          if (alertProgressStack[i].isProgrss) {
            break;
          }
        }

        if (i >= 0) {
          alertProgressStack.splice(i, 1);
          this.setState({
            alertProgressStack
          });
        }
      });

      _defineProperty(this, "updateProgress", (id, args = {}) => {
        const {
          alertProgressStack
        } = this.state;
        const targetObjects = alertProgressStack.filter(alertOrProgress => {
          return alertOrProgress.isProgrss && alertOrProgress.id === id;
        });

        if (targetObjects.length === 0) {
          return;
        }

        const targetObject = targetObjects[targetObjects.length - 1];
        Object.assign(targetObject, args);
        this.setState({
          alertProgressStack
        });
      });

      _defineProperty(this, "popUp", args => {
        let {
          id,
          type,
          message,
          caption
        } = args;
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

        let {
          buttons,
          checkBox
        } = this.buttonsGenerator(args);
        let checkBoxText = checkBox ? checkBox.text : null;
        let checkBoxCallbacks = checkBox ? checkBox.callbacks : null;
        this.pushToStack({
          id,
          caption,
          message,
          buttons,
          checkBoxText,
          checkBoxCallbacks
        });
      });

      _defineProperty(this, "buttonsGenerator", args => {
        let {
          id,
          buttons,
          buttonType,
          buttonLabels,
          checkBox,
          callbacks,
          primaryButtonIndex,
          onYes,
          onNo,
          onConfirm,
          onRetry,
          onCancel
        } = args;

        if (buttons) {
          return {
            buttons,
            checkBox
          };
        }

        switch (buttonType) {
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
            className: buttonLabels.length === 1 || i === primaryButtonIndex || primaryButtonIndex === undefined ? 'btn-default primary' : 'btn-default'
          };

          if (callbacks && typeof callbacks === 'function') {
            b.onClick = () => {
              callbacks(id);
            };
          } else if (callbacks && callbacks.length > i) {
            b.onClick = () => {
              callbacks[i](id);
            };
          } else if (!callbacks) {
            b.onClick = () => {};
          }

          return b;
        });
        return {
          buttons,
          checkBox
        };
      });

      _defineProperty(this, "popUpDeviceBusy", id => {
        this.popUp({
          id,
          message: i18n.lang.message.device_busy.message,
          caption: i18n.lang.message.device_busy.caption
        });
      });

      this.state = {
        alertProgressStack: []
      };
    }

    render() {
      const {
        alertProgressStack
      } = this.state;
      const {
        popFromStack,
        popById,
        popUp,
        openProgress,
        updateProgress,
        popLastProgress,
        pushToStack,
        popUpDeviceBusy
      } = this;
      return /*#__PURE__*/React.createElement(AlertProgressContext.Provider, {
        value: {
          alertProgressStack,
          popFromStack,
          popById,
          popUp,
          openProgress,
          updateProgress,
          popLastProgress,
          pushToStack,
          popUpDeviceBusy
        }
      }, this.props.children);
    }

  }

  ;
  return {
    AlertProgressContextProvider,
    AlertProgressContext
  };
});