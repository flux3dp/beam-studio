function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['app/constants/progress-constants', 'jsx!widgets/Modal', 'jsx!widgets/Button-Group', 'jsx!/contexts/AlertProgressContext'], function (ProgressConstants, Modal, ButtonGroup, {
  AlertProgressContext
}) {
  const React = require('react');

  const classNames = require('classnames');

  let ret = {};

  class Progress extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_renderCaption", caption => {
        return caption ? /*#__PURE__*/React.createElement("div", {
          className: "caption"
        }, caption) : null;
      });

      _defineProperty(this, "_renderMessage", progress => {
        let content;

        if (progress.type === ProgressConstants.NONSTOP) {
          content = /*#__PURE__*/React.createElement("div", {
            className: classNames('spinner-roller spinner-roller-reverse')
          });
        } else if (progress.type === ProgressConstants.STEPPING) {
          const progressStyle = {
            width: (progress.percentage || 0) + '%'
          };
          content = /*#__PURE__*/React.createElement("div", {
            className: "stepping-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "progress-message"
          }, progress.message), /*#__PURE__*/React.createElement("div", {
            className: "progress-bar"
          }, /*#__PURE__*/React.createElement("div", {
            className: "current-progress",
            style: progressStyle
          })));
        }

        return /*#__PURE__*/React.createElement("pre", {
          className: "message"
        }, content);
      });
    }

    render() {
      const {
        progress,
        popFromStack
      } = this.props;
      return /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
        className: classNames('modal-alert', 'progress')
      }, this._renderCaption(progress.caption), this._renderMessage(progress)));
    }

  }

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

      _defineProperty(this, "render", () => {
        const {
          alert,
          popFromStack
        } = this.props;
        const {
          checkboxChecked
        } = this.state;
        let buttons = alert.buttons.map((b, i) => {
          const newButton = { ...b
          };
          const buttonCallback = b.onClick;

          if (!checkboxChecked || !alert.checkBoxText || !alert.checkBoxCallbacks) {
            newButton.onClick = () => {
              popFromStack();
              buttonCallback();
            };
          } else {
            // Need to reset checkbox state after callback
            if (typeof alert.checkBoxCallbacks === 'function') {
              newButton.onClick = () => {
                popFromStack();
                alert.checkBoxCallbacks();
                this.setState({
                  checkboxChecked: false
                });
              };
            } else if (alert.checkBoxCallbacks.length > i) {
              newButton.onClick = () => {
                popFromStack();
                alert.checkBoxCallbacks[i]();
                this.setState({
                  checkboxChecked: false
                });
              };
            } else {
              newButton.onClick = () => {
                popFromStack();
                buttonCallback();
                this.setState({
                  checkboxChecked: false
                });
              };
            }
          }

          return newButton;
        });
        let checkBox = alert.checkBoxText ? this._renderCheckbox(alert.checkBoxText) : null;
        return /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
          className: classNames('modal-alert', 'animate__animated', 'animate__bounceIn')
        }, this._renderCaption(alert.caption), this._renderMessage(alert), checkBox, /*#__PURE__*/React.createElement(ButtonGroup, {
          buttons: buttons
        })));
      });

      this.state = {
        checkboxChecked: false
      };
    }

  }

  class AlertsAndProgress extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        checkboxChecked: false
      };
    }

    componentDidMount() {
      ret.contextCaller = this.context;
    }

    render() {
      const {
        alertProgressStack,
        popFromStack
      } = this.context;
      const components = alertProgressStack.map((alertOrProgress, index) => {
        if (alertOrProgress.isProgrss) {
          return /*#__PURE__*/React.createElement(Progress, {
            key: index,
            progress: alertOrProgress,
            popFromStack: popFromStack
          });
        } else {
          return /*#__PURE__*/React.createElement(Alert, {
            key: index,
            alert: alertOrProgress,
            popFromStack: popFromStack
          });
        }
      });
      return /*#__PURE__*/React.createElement("div", {
        className: "alerts-container"
      }, components);
      ;
    }

  }

  ;
  AlertsAndProgress.contextType = AlertProgressContext;
  ret.AlertsAndProgress = AlertsAndProgress;
  return ret;
});