function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'app/actions/beambox/beambox-preference', 'app/actions/beambox/constant', 'helpers/i18n'], function (Modal, BeamboxPreference, Constant, i18n) {
  'use strict';

  const React = require('react');

  const lang = i18n.lang;
  return function () {
    var _temp;

    return _temp = class SelectMachineType extends React.Component {
      constructor(...args) {
        super(...args);

        _defineProperty(this, "onSelectMachine", model => {
          BeamboxPreference.write('model', model);
          BeamboxPreference.write('workarea', model);
          location.hash = '#initialize/connect/select-connection-type';
        });

        _defineProperty(this, "skipConnectMachine", () => {
          location.hash = '#initialize/connect/skip-connect-machine';
        });

        _defineProperty(this, "renderSelectMachineStep", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "select-machine-type"
          }, /*#__PURE__*/React.createElement("h1", {
            className: "main-title"
          }, lang.initialize.select_machine_type), /*#__PURE__*/React.createElement("div", {
            className: "btn-h-group"
          }, /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onSelectMachine('fbm1')
          }, 'beamo'), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onSelectMachine('fbb1b')
          }, 'Beambox'), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onSelectMachine('fbb1p')
          }, 'Beambox Pro')), /*#__PURE__*/React.createElement("div", {
            className: "btn btn-link",
            onClick: () => this.skipConnectMachine()
          }, lang.initialize.no_machine));
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