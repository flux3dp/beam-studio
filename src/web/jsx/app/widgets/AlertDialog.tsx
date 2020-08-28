function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Button-Group', 'helpers/i18n'], function (ButtonGroup, i18n) {
  'use strict';

  const React = require('react');

  var lang = i18n.lang.buttons;

  class AlertDialog extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_renderMessage", () => {
        if (this.props.displayImages) {
          return /*#__PURE__*/React.createElement("img", {
            className: this.props.imgClass,
            src: this.props.images[this.state.imgIndex]
          });
        } else {
          return typeof this.props.message === 'string' ? /*#__PURE__*/React.createElement("pre", {
            className: "message",
            dangerouslySetInnerHTML: {
              __html: this.props.message
            }
          }) : /*#__PURE__*/React.createElement("pre", {
            className: "message"
          }, this.props.message);
        }
      });

      _defineProperty(this, "_renderCheckbox", () => {
        const self = this;

        const _handleCheckboxClick = function (e) {
          if (e.target.checked) {
            self.props.buttons[0].onClick = () => {
              self.props.checkedCallback();
              self.props.onClose();
            };
          } else {
            self.props.buttons[0].onClick = () => {
              self.props.onClose();
            };
          }

          self.setState(self.state);
        };

        if (this.props.checkbox) {
          return /*#__PURE__*/React.createElement("div", {
            className: "modal-checkbox"
          }, /*#__PURE__*/React.createElement("input", {
            type: "checkbox",
            onClick: _handleCheckboxClick
          }), this.props.checkbox);
        } else {
          return null;
        }
      });

      _defineProperty(this, "_renderButtons", () => {
        var self = this;

        if (this.props.displayImages) {
          if (this.state.imgIndex < this.props.images.length - 1) {
            return /*#__PURE__*/React.createElement(ButtonGroup, {
              buttons: [{
                label: lang.next,
                right: true,
                onClick: () => {
                  self.setState({
                    imgIndex: this.state.imgIndex + 1
                  });
                }
              }]
            });
          } else {
            return /*#__PURE__*/React.createElement(ButtonGroup, {
              buttons: [{
                label: lang.next,
                right: true,
                onClick: () => {
                  self.setState({
                    imgIndex: 0
                  });
                  this.props.onCustom();
                  self.props.onClose();
                }
              }]
            });
          }
        } else {
          return /*#__PURE__*/React.createElement(ButtonGroup, {
            buttons: this.props.buttons
          });
        }
      });

      this.state = {
        imgIndex: 0
      };
    }

    render() {
      var caption = '' !== this.props.caption ? /*#__PURE__*/React.createElement("h2", {
        className: "caption"
      }, this.props.caption) : '',
          html = this._renderMessage(),
          checkbox = this._renderCheckbox(),
          buttons = this._renderButtons(),
          className = 'modal-alert';

      if (this.props.displayImages) {
        className += ' ' + this.props.imgClass;
      }

      return /*#__PURE__*/React.createElement("div", {
        className: className
      }, caption, html, checkbox, buttons);
    }

  }

  ;
  AlertDialog.defaultProps = {
    lang: {},
    caption: '',
    checkbox: '',
    message: '',
    buttons: [],
    images: [],
    imgClass: '',
    displayImages: false,
    onCustom: function () {},
    onClose: function () {}
  };
  return AlertDialog;
});