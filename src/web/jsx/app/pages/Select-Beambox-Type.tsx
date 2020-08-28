function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'helpers/i18n'], function (Modal, i18n) {
  'use strict';

  const React = require('react');

  const lang = i18n.lang;
  return function () {
    var _temp;

    return _temp = class SelectBeamboxType extends React.Component {
      constructor(...args) {
        super(...args);

        _defineProperty(this, "_renderSelectMachineStep", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "select-machine-type"
          }, /*#__PURE__*/React.createElement("h1", {
            className: "main-title"
          }, lang.initialize.select_beambox_type), /*#__PURE__*/React.createElement("div", {
            className: "btn-h-group"
          }, /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large",
            onClick: () => location.hash = '#initialize/wifi/connect-beambox'
          }, /*#__PURE__*/React.createElement("p", {
            className: "subtitle"
          }, "Beambox")), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large",
            onClick: () => location.hash = '#initialize/wifi/connect-beambox#Pro'
          }, /*#__PURE__*/React.createElement("p", {
            className: "subtitle"
          }, "Beambox Pro"))));
        });
      }

      render() {
        const wrapperClassName = {
          'initialization': true
        };

        const innerContent = this._renderSelectMachineStep();

        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", {
          className: "connecting-means"
        }, innerContent, /*#__PURE__*/React.createElement("a", {
          href: "#initialize/wifi/setup-complete/with-usb",
          "data-ga-event": "skip",
          className: "btn btn-link btn-large"
        }, lang.initialize.no_machine)));
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});