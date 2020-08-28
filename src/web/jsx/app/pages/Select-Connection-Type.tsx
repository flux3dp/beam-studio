function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'helpers/i18n'], function (Modal, i18n) {
  'use strict';

  const React = require('react');

  const lang = i18n.lang.initialize;
  return function () {
    var _temp;

    return _temp = class SelectConnectionType extends React.Component {
      constructor(...args) {
        super(...args);

        _defineProperty(this, "onClick", method => {
          switch (method) {
            case 'wi-fi':
              location.hash = '#initialize/connect/connect-wi-fi';
              break;

            case 'wired':
              location.hash = '#initialize/connect/connect-wired';
              break;

            case 'ether2ether':
              location.hash = '#initialize/connect/connect-ethernet';
              break;
          } //location.hash = '#initialize/connect/connect-beamo';

        });

        _defineProperty(this, "renderSelectConnectTypeStep", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "select-connection-type"
          }, /*#__PURE__*/React.createElement("h1", {
            className: "main-title"
          }, lang.select_connection_type), /*#__PURE__*/React.createElement("div", {
            className: "btn-h-group"
          }, /*#__PURE__*/React.createElement("div", {
            className: "btn-container"
          }, /*#__PURE__*/React.createElement("img", {
            className: "connect-btn-icon",
            src: "img/init-panel/icon-wifi.svg",
            draggable: "false"
          }), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onClick('wi-fi')
          }, lang.connection_types.wifi)), /*#__PURE__*/React.createElement("div", {
            className: "btn-container"
          }, /*#__PURE__*/React.createElement("img", {
            className: "connect-btn-icon",
            src: "img/init-panel/icon-wired.svg",
            draggable: "false"
          }), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onClick('wired')
          }, lang.connection_types.wired)), /*#__PURE__*/React.createElement("div", {
            className: "btn-container"
          }, /*#__PURE__*/React.createElement("img", {
            className: "connect-btn-icon",
            src: "img/init-panel/icon-e2e.svg",
            draggable: "false"
          }), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action",
            onClick: () => this.onClick('ether2ether')
          }, lang.connection_types.ether_to_ether))));
        });

        _defineProperty(this, "renderButtons", () => {
          const isNewUser = localStorage.getItem('printer-is-ready') !== 'true';
          return /*#__PURE__*/React.createElement("div", {
            className: "btn-page-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "btn-page primary",
            onClick: () => {
              if (isNewUser) {
                localStorage.setItem('new-user', true);
              }

              localStorage.setItem('printer-is-ready', true);
              location.hash = '#studio/beambox';
            }
          }, isNewUser ? lang.skip : lang.cancel));
        });
      }

      render() {
        const wrapperClassName = {
          'initialization': true
        };
        const innerContent = this.renderSelectConnectTypeStep();
        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine"
        }, /*#__PURE__*/React.createElement("div", {
          className: "top-bar"
        }), this.renderButtons(), innerContent);
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});