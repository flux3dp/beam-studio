function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'app/actions/beambox/beambox-preference', 'app/actions/beambox/constant', 'helpers/i18n'], function (Modal, BeamboxPreference, Constant, i18n) {
  'use strict';

  const React = require('react');

  const lang = i18n.lang;
  return function () {
    var _temp;

    return _temp = class SkipConnectMachine extends React.Component {
      constructor(...args) {
        super(...args);

        _defineProperty(this, "onStart", () => {
          if (!localStorage.getItem('printer-is-ready')) {
            localStorage.setItem('new-user', true);
          }

          localStorage.setItem('printer-is-ready', true);
          location.hash = '#studio/beambox';
          location.reload();
        });

        _defineProperty(this, "renderSelectMachineStep", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "skip-connect-machine"
          }, /*#__PURE__*/React.createElement("h1", {
            className: "main-title"
          }, lang.initialize.setting_completed.great), /*#__PURE__*/React.createElement("div", {
            className: "text-content"
          }, lang.initialize.setting_completed.setup_later), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onStart()
          }, lang.initialize.setting_completed.ok));
        });
      }

      render() {
        const wrapperClassName = {
          'initialization': true
        };
        const innerContent = this.renderSelectMachineStep();
        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine"
        }, /*#__PURE__*/React.createElement("div", {
          className: "top-bar"
        }), innerContent);
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});