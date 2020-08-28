function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'jsx!widgets/Button-Group', 'jsx!/contexts/AlertContext'], function (Modal, ButtonGroup, {
  AlertContext
}) {
  const React = require('react');

  let ret = {};

  class Alert extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_renderCaption", caption => {
        return caption ? /*#__PURE__*/React.createElement("h2", {
          className: "caption"
        }, caption) : null;
      });

      _defineProperty(this, "_renderMessage", alert => {
        return typeof alert.message === 'string' ? /*#__PURE__*/React.createElement("pre", {
          className: "message",
          dangerouslySetInnerHTML: {
            __html: alert.message
          }
        }) : /*#__PURE__*/React.createElement("pre", {
          className: "message"
        }, alert.message);
      });

      _defineProperty(this, "_renderCheckbox", checkBoxText => {
        let _handleCheckboxClick = () => {
          this.setState({
            checkboxChecked: !this.state.checkboxChecked
          });
        };

        return /*#__PURE__*/React.createElement("div", {
          className: "modal-checkbox"
        }, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          onClick: _handleCheckboxClick
        }), checkBoxText);
      });

      this.state = {
        checkboxChecked: false
      };
    }

    componentDidMount() {
      ret.AlertContextCaller = this.context;
    }

    render() {
      const {
        index
      } = this.props;
      const {
        checkboxChecked
      } = this.state;
      const {
        alertStack,
        popAlertStack
      } = this.context;

      if (alertStack.length <= index) {
        return null;
      }

      const alert = alertStack[index];
      let buttons = alert.buttons.map((b, i) => {
        const newButton = { ...b
        };
        const buttonCallback = b.onClick;

        if (!checkboxChecked || !alert.checkBoxText || !alert.checkBoxCallbacks) {
          newButton.onClick = () => {
            popAlertStack();
            buttonCallback();
          };
        } else {
          if (typeof alert.checkBoxCallbacks === 'function') {
            newButton.onClick = () => {
              popAlertStack();
              alert.checkBoxCallbacks();
            };
          } else if (alert.checkBoxCallbacks.length > i) {
            newButton.onClick = () => {
              popAlertStack();
              alert.checkBoxCallbacks[i]();
            };
          } else {
            newButton.onClick = () => {
              popAlertStack();
              buttonCallback();
            };
          }
        }

        return newButton;
      });
      let checkBox = alert.checkBoxText ? this._renderCheckbox(alert.checkBoxText) : null;
      return /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
        className: "modal-alert"
      }, this._renderCaption(alert.caption), this._renderMessage(alert), checkBox, /*#__PURE__*/React.createElement(ButtonGroup, {
        buttons: buttons
      })), /*#__PURE__*/React.createElement(Alert, {
        index: index + 1
      }));
    }

  }

  ;
  Alert.contextType = AlertContext;
  ret.Alert = Alert;
  return ret;
});