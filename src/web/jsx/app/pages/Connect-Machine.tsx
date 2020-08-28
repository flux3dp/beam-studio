function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactClassset', 'app/actions/initialize-machine', 'helpers/api/discover', 'helpers/api/usb-config', 'helpers/api/upnp-config', 'jsx!widgets/Modal', 'jsx!views/Printer-Selector', 'app/actions/alert-actions', 'app/actions/progress-actions', 'app/constants/progress-constants', 'helpers/device-master'], function (ReactCx, initializeMachine, discover, usbConfig, upnpConfig, Modal, PrinterSelector, AlertActions, ProgressActions, ProgressConstants, DeviceMaster) {
  'use strict';

  const React = require('react');

  return function (args) {
    var upnpMethods,
        usbConnectionTestingTimer,
        args = args || {};

    class ConnectMachine extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_setSettingPrinter", printer => {
          // temporary store for setup
          initializeMachine.settingPrinter.set(printer);
          location.hash = '#initialize/connect/set-printer';
        });

        _defineProperty(this, "_onUsbStartingSetUp", e => {
          var self = this,
              lang = this.state.lang,
              usb = usbConfig({
            forceReconnect: true
          });

          self._toggleBlocker(true);

          usb.list({
            onSuccess: function (response) {
              response = response || {};

              self._toggleBlocker(false);

              response.from = 'USB';

              self._setSettingPrinter(response);
            },
            onError: function (response) {
              self._toggleBlocker(false);

              AlertActions.showPopupError('connection-fail', lang.initialize.errors.keep_connect.content, lang.initialize.errors.keep_connect.caption);
            }
          });
        });

        _defineProperty(this, "_onWifiStartingSetUp", e => {
          var self = this,
              discoverMethods,
              timer;
          discoverMethods = discover('upnp-config', printers => {
            clearTimeout(timer); // if (1 < printers.length) {

            if (Object.keys(printers).length > 1) {
              self._toggleBlocker(false);

              self.setState({
                showPrinters: true
              });
            } else {
              self._onGettingPrinter(printers[0]);
            }

            discoverMethods.removeListener('upnp-config');
          });
          timer = setTimeout(function () {
            clearTimeout(timer);

            self._toggleBlocker(false);

            location.hash = '#initialize/connect/not-found';
          }, 1000);

          self._toggleBlocker(true);
        });

        _defineProperty(this, "_toggleBlocker", open => {
          if (true === open) {
            ProgressActions.open(ProgressConstants.NONSTOP);
          } else {
            ProgressActions.close();
          }
        });

        _defineProperty(this, "_onGettingPrinter", currentPrinter => {
          var self = this,
              lastError;

          self._toggleBlocker(true);

          currentPrinter = currentPrinter || {};
          currentPrinter.from = 'WIFI';
          currentPrinter.apName = currentPrinter.name;
          upnpMethods = upnpConfig(currentPrinter.uuid);
          upnpMethods.ready(function () {
            self._toggleBlocker(false);

            if ('undefined' !== typeof lastError) {
              upnpMethods.addKey();
            }

            self._setSettingPrinter(currentPrinter);
          }).always(() => {
            self._toggleBlocker(false);
          }).progress(function (response) {
            switch (response.status) {
              case 'error':
                lastError = response;

                self._toggleBlocker(false);

                break;

              case 'waiting':
                currentPrinter.plaintext_password = response.plaintext_password;

                self._toggleBlocker(true);

                break;
            }
          });
        });

        _defineProperty(this, "_closePrinterList", () => {
          this.setState({
            showPrinters: false
          });
        });

        _defineProperty(this, "_renderPrinters", lang => {
          var content = /*#__PURE__*/React.createElement(PrinterSelector, {
            uniqleId: "connect-via-wifi",
            className: "absolute-center",
            lang: lang,
            forceAuth: true,
            bypassDefaultPrinter: true,
            bypassCheck: true,
            onGettingPrinter: this._onGettingPrinter
          });
          return true === this.state.showPrinters ? /*#__PURE__*/React.createElement(Modal, {
            onClose: this._closePrinterList,
            content: content
          }) : '';
        });

        _defineProperty(this, "_renderConnectionStep", () => {
          const lang = this.state.lang;
          const usbButtonClass = ReactCx.cx({
            'btn': true,
            'btn-action': true,
            'btn-large': true,
            'usb-disabled': !this.state.usbConnected
          });
          const useWifi = /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large",
            "data-ga-event": "next-via-wifi",
            onClick: this._onWifiStartingSetUp
          }, /*#__PURE__*/React.createElement("h1", {
            className: "headline"
          }, lang.initialize.connect_flux), /*#__PURE__*/React.createElement("p", {
            className: "subtitle"
          }, lang.initialize.via_wifi), /*#__PURE__*/React.createElement("img", {
            className: "scene",
            src: "img/via-wifi.png"
          }));
          const useUsb = /*#__PURE__*/React.createElement("button", {
            className: usbButtonClass,
            "data-ga-event": "next-via-usb",
            onClick: this._onUsbStartingSetUp
          }, /*#__PURE__*/React.createElement("h1", {
            className: "headline"
          }, lang.initialize.connect_flux), /*#__PURE__*/React.createElement("p", {
            className: "subtitle"
          }, lang.initialize.via_usb), /*#__PURE__*/React.createElement("img", {
            className: "scene",
            src: "img/wifi-plug-01.png"
          }));
          return /*#__PURE__*/React.createElement("div", {
            className: "btn-h-group"
          }, useWifi, useUsb);
        });

        var _self = this;

        usbConnectionTestingTimer = setInterval(function () {
          _self.setState({
            usbConnected: DeviceMaster.getAvailableUsbChannel() >= 0
          });
        }, 1000);
        this.state = {
          lang: args.state.lang,
          showPrinters: false,
          usbConnected: false
        };
      } // Lifecycle


      componentWillUnmount() {
        if ('undefined' !== typeof upnpMethods) {
          upnpMethods.connection.close();
        }

        clearInterval(usbConnectionTestingTimer);
      } // UI events


      render() {
        const lang = this.state.lang;
        const wrapperClassName = {
          'initialization': true
        };

        const printersSelection = this._renderPrinters(lang);

        const innerContent = this._renderConnectionStep();

        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", {
          className: "connecting-means"
        }, innerContent, /*#__PURE__*/React.createElement("a", {
          href: "#initialize/connect/setup-complete/with-usb",
          "data-ga-event": "skip",
          className: "btn btn-link btn-large"
        }, lang.initialize.no_machine)), printersSelection);
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }

    ;
    return ConnectMachine;
  };
});