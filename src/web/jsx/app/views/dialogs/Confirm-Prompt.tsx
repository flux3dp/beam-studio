function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Button-Group', 'jsx!widgets/Modal', 'app/constants/keycode-constants', 'helpers/i18n'], function (ButtonGroup, Modal, keyCodeConstants, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.alert;

  class ConfirmPrompt extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "onValidate", () => {
        const {
          confirmValue
        } = this.props;

        if (!confirmValue) {
          this.onConfirmed();
        } else {
          if (confirmValue === this.refs.textInput.value) {
            this.onConfirmed();
          } else {
            this.onConfirmFailed();
          }
        }
      });

      _defineProperty(this, "onConfirmed", () => {
        const {
          onConfirmed,
          onClose
        } = this.props;
        onConfirmed();
        onClose();
      });

      _defineProperty(this, "onConfirmFailed", () => {
        this.refs.textInput.value = '';
        this.refs.container.classList.remove('animate__animated', 'animate__bounceIn');
        this.refs.container.offsetWidth; // some magic: https://css-tricks.com/restart-css-animation/

        this.refs.container.classList.add('animate__animated', 'animate__bounceIn');
      });

      _defineProperty(this, "handleKeyDown", e => {
        if (e.keyCode === keyCodeConstants.KEY_RETURN) {
          this.onValidate();
        }

        e.stopPropagation();
      });

      _defineProperty(this, "renderButtons", () => {
        const {
          buttons,
          onCancel,
          onClose
        } = this.props;

        if (buttons) {
          return /*#__PURE__*/React.createElement(ButtonGroup, {
            className: "btn-right",
            buttons: buttons
          });
          ;
        }

        const defaultButtons = [{
          label: LANG.ok,
          className: 'btn-default primary',
          onClick: () => {
            this.onValidate();
          }
        }, {
          label: LANG.cancel,
          className: 'btn-default',
          onClick: () => {
            if (onCancel) {
              onCancel(this.refs.textInput.value);
            }

            onClose();
          }
        }];
        return /*#__PURE__*/React.createElement(ButtonGroup, {
          className: "btn-right",
          buttons: defaultButtons
        });
      });
    }

    componentDidMount() {}

    render() {
      return /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
        className: classNames('confirm-prompt-dialog-container', 'animate__animated', 'animate__bounceIn'),
        ref: "container"
      }, /*#__PURE__*/React.createElement("div", {
        className: "caption"
      }, this.props.caption), /*#__PURE__*/React.createElement("pre", {
        className: "message"
      }, this.props.message), /*#__PURE__*/React.createElement("input", {
        autoFocus: true,
        ref: "textInput",
        className: "text-input",
        type: "text",
        onKeyDown: e => this.handleKeyDown(e),
        placeholder: this.props.confirmValue
      }), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, this.renderButtons())));
    }

  }

  ;
  return ConfirmPrompt;
});