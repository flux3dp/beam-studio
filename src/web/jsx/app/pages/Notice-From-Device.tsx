function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['app/actions/initialize-machine', 'jsx!widgets/Modal', 'helpers/sprintf'], function (initializeMachine, Modal, sprintf) {
  const React = require('react');

  'use strict';

  return function (args) {
    args = args || {};

    class NoticeFromDevice extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_restartStudio", e => {
          initializeMachine.completeSettingUp(true);
          location.reload();
        });

        this.state = {
          lang: args.state.lang
        };
      }

      rendern() {
        let wifi = initializeMachine.settingWifi.get();
        var lang = this.state.lang,
            localLang = lang.initialize.notice_from_device,
            settingPrinter = initializeMachine.settingPrinter.get(),
            wrapperClassName = {
          'initialization': true
        },
            successfullyStatement = sprintf(localLang.successfully_statement, wifi.ssid),
            content = /*#__PURE__*/React.createElement("div", {
          className: "notice-from-device text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", {
          className: "connecting-means"
        }, /*#__PURE__*/React.createElement("h1", {
          className: "headline"
        }, localLang.headline), /*#__PURE__*/React.createElement("h2", {
          className: "subtitle"
        }, localLang.subtitle), /*#__PURE__*/React.createElement("div", {
          className: "signal-means row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("img", {
          className: "signal-position col",
          src: "img/wifi-indicator.png"
        }), /*#__PURE__*/React.createElement("div", {
          className: "signal-description col"
        }, /*#__PURE__*/React.createElement("article", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("span", {
          className: "green-light col"
        }), /*#__PURE__*/React.createElement("h4", {
          className: "green-light-desc col"
        }, localLang.light_on, /*#__PURE__*/React.createElement("p", null, localLang.light_on_desc))), /*#__PURE__*/React.createElement("article", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("span", {
          className: "green-light breathing col"
        }), /*#__PURE__*/React.createElement("h4", {
          className: "green-light-desc col"
        }, localLang.breathing, /*#__PURE__*/React.createElement("p", null, localLang.breathing_desc))))), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("p", {
          className: "headline"
        }, localLang.successfully), /*#__PURE__*/React.createElement("p", {
          className: "subtitle"
        }, successfullyStatement)), /*#__PURE__*/React.createElement("div", {
          className: "button-group btn-v-group"
        }, /*#__PURE__*/React.createElement("button", {
          "data-ga-event": "restart-flux-studio",
          className: "btn btn-action btn-large",
          onClick: this._restartStudio
        }, localLang.restart), /*#__PURE__*/React.createElement("a", {
          href: "#initialize/connect/select",
          "data-ga-event": "back",
          className: "btn btn-link btn-large"
        }, lang.initialize.back))));
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }

    ;
    return NoticeFromDevice;
  };
});