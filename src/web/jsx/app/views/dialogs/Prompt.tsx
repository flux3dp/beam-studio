function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Button-Group', 'jsx!widgets/Modal', 'app/constants/keycode-constants', 'helpers/i18n'], function (ButtonGroup, Modal, keyCodeConstants, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.alert;

  class Prompt extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "handleKeyDown", e => {
        const {
          onYes,
          onClose
        } = this.props;

        if (e.keyCode === keyCodeConstants.KEY_RETURN) {
          if (onYes) {
            onYes(this.refs.textInput.value);
          }

          onClose();
        }

        e.stopPropagation();
      });

      _defineProperty(this, "renderButtons", () => {
        const {
          buttons,
          onYes,
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
          label: LANG.ok2,
          className: 'btn-default primary',
          onClick: () => {
            if (onYes) {
              onYes(this.refs.textInput.value);
            }

            onClose();
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
      return /*#__PURE__*/React.createElement(Modal, {
        onClose: this.props.closeOnBackgroundClick ? this.props.onClose : () => {}
      }, /*#__PURE__*/React.createElement("div", {
        className: classNames('prompt-dialog-container', 'animate__animated', 'animate__bounceIn')
      }, /*#__PURE__*/React.createElement("div", {
        className: "caption"
      }, this.props.caption), /*#__PURE__*/React.createElement("input", {
        autoFocus: true,
        ref: "textInput",
        className: "text-input",
        type: "text",
        onKeyDown: e => this.handleKeyDown(e),
        defaultValue: this.props.defaultValue
      }), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, this.renderButtons())));
    }

  }

  ;
  return Prompt;
});