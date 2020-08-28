function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['app/actions/initialize-machine', 'helpers/api/discover', 'helpers/api/upnp-config', 'helpers/i18n', 'jsx!widgets/Modal', 'app/actions/progress-actions', 'app/constants/progress-constants', 'app/actions/alert-actions'], function (initializeMachine, discover, upnpConfig, i18n, Modal, ProgressActions, ProgressConstants, AlertActions) {
  const React = require('react');

  'use strict';

  return function (args) {
    var upnpMethods;
    args = args || {};

    class PrinterNotFound extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "componentWillUnmount", () => {
          if (typeof upnpMethods !== 'undefined') {
            upnpMethods.connection.close();
          }
        });

        _defineProperty(this, "_retrieveDevice", e => {
          var self = this,
              currentPrinter,
              discoverMethods = discover('upnp-config', printers => {
            clearTimeout(timer);
            ProgressActions.close();
            currentPrinter = printers[0] || {};
            currentPrinter.from = 'WIFI';
            upnpMethods = upnpConfig(currentPrinter.uuid);
            discoverMethods.removeListener('upnp-config'); // temporary store for setup

            initializeMachine.settingPrinter.set(currentPrinter);
            location.hash = '#initialize/connect/set-printer';
          }),
              timer = setTimeout(function () {
            ProgressActions.close();
            AlertActions.showPopupError('retrieve-device-fail', self.state.lang.initialize.errors.not_found);
            clearTimeout(timer);
          }, 1000);
          ProgressActions.open(ProgressConstants.NONSTOP);
        });

        this.state = {
          lang: args.state.lang
        };
      }

      render() {
        const lang = this.state.lang;
        const localLang = lang.initialize.notice_from_device;
        const wrapperClassName = {
          'initialization': true
        };
        const imgLang = 'en' === i18n.getActiveLang() ? 'en' : 'zh';
        const imgSrc = `img/wifi-error-notify-delta-${imgLang}.png`;
        const content = /*#__PURE__*/React.createElement("div", {
          className: "device-not-found text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
          className: "not-found-img",
          src: imgSrc
        }), /*#__PURE__*/React.createElement("div", {
          className: "button-group btn-v-group"
        }, /*#__PURE__*/React.createElement("button", {
          "data-ga-event": "retry-getting-device-from-wifi",
          className: "btn btn-action btn-large",
          onClick: this._retrieveDevice
        }, lang.initialize.retry), /*#__PURE__*/React.createElement("a", {
          href: "#initialize/connect/connect-machine",
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
    return PrinterNotFound;
  };
});