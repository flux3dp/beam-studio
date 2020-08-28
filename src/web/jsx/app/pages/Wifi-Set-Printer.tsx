function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactClassset', 'app/actions/initialize-machine', 'helpers/api/usb-config', 'jsx!widgets/Modal', 'jsx!widgets/AlertDialog', 'app/actions/alert-actions', 'app/stores/alert-store', 'helpers/api/config', 'helpers/api/upnp-config', 'helpers/device-master', 'app/actions/progress-actions', 'app/constants/progress-constants', 'helpers/device-error-handler'], function (ReactCx, initializeMachine, usbConfig, Modal, AlertDialog, AlertActions, AlertStore, Config, upnpConfig, DeviceMaster, ProgressActions, ProgressConstants, DeviceErrorHandler) {
  'use strict';

  const React = require('react');

  const ReactDOM = require('react-dom');

  return function (args) {
    var _temp;

    var upnpMethods;
    args = args || {};
    return _temp = class WifiSetPrinter extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_monitorUsb", usbOn => {
          if (!usbOn) {
            AlertActions.showPopupError('USB_UNPLUGGED', this.state.lang.message.usb_unplugged);
            location.hash = '#initialize/connect/connect-machine';
          }
        });

        _defineProperty(this, "_handleSetPrinter", e => {
          e.preventDefault();

          var self = this,
              name = ReactDOM.findDOMNode(self.refs.name).value,
              password = ReactDOM.findDOMNode(self.refs.password).value,
              oldPasswordExists = 'undefined' !== typeof self.refs.old_password,
              oldPassword = 'WIFI' === self.state.settingPrinter.from && true === oldPasswordExists ? ReactDOM.findDOMNode(self.refs.old_password).value : self.state.settingPrinter.plaintext_password || '',
              usb,
              lang = self.state.lang,
              onError = function (response) {
            ProgressActions.close();
            AlertActions.showPopupError('set-machine-error', DeviceErrorHandler.translate(response.error));
          },
              goNext = function () {
            self.state.settingPrinter.name = name;
            initializeMachine.settingPrinter.set(self.state.settingPrinter);
            location.hash = '#initialize/connect/select';
            ProgressActions.close();
          },
              setPassword = function (password) {
            setMachine.password(password, {
              onSuccess: function (response) {
                goNext();
              }
            });
          },
              startSettingWithUsb = function () {
            usb = usbConfig();
            setMachine = usb.setMachine({
              onError: onError
            });
            setMachine.name(name, {
              onSuccess: function (response) {
                if ('' !== password) {
                  setPassword(password);
                } else {
                  goNext();
                }

                Config().write('configured-printer', JSON.stringify(self.state.settingPrinter));
                Config().write('configured-model', self.state.settingPrinter.model === 'delta-1' ? 'fd1' : 'fd1p');
              }
            });
          },
              startSettingWithWifi = function () {
            var $deferred = $.Deferred();
            upnpMethods = upnpConfig(self.state.settingPrinter.uuid);
            $.when(upnpMethods.name(name), upnpMethods.password(oldPassword, password)).always(function () {
              ProgressActions.close();
            }).done(function () {
              Config().write('configured-printer', JSON.stringify(self.state.settingPrinter));
              Config().write('configured-model', self.state.settingPrinter.model === 'delta-1' ? 'fd1' : 'fd1p');
              goNext();
            }).fail(function (response) {
              AlertActions.showPopupError('set-machine-error', lang.initialize.set_machine_generic.incorrect_old_password);
            });
          },
              cancelSetting = function () {
            AlertStore.removeYesListener(settingPrinter);
            AlertStore.removeNoListener(cancelSetting);
          },
              setMachine,
              isValidName,
              settingPrinter = function () {
            AlertStore.removeYesListener(settingPrinter);
            AlertStore.removeNoListener(cancelSetting);
            ProgressActions.open(ProgressConstants.NONSTOP);

            if ('WIFI' === self.state.settingPrinter.from) {
              startSettingWithWifi();
            } else {
              startSettingWithUsb();
            }
          };

          isValidName = name !== '' && false === /[^()\u4e00-\u9fa5a-zA-Z0-9\+ ’'_\-]+/g.test(name);
          self.setState({
            requirePrinterName: name !== '',
            validPrinterName: isValidName
          });

          if (true === isValidName) {
            if (true === self.state.settingPrinter.password && '' !== password) {
              AlertStore.onYes(settingPrinter);
              AlertStore.onNo(cancelSetting);
              AlertActions.showPopupYesNo('change-password', lang.initialize.change_password.content, lang.initialize.change_password.confirm);
            } else {
              settingPrinter();
            }
          }
        });

        _defineProperty(this, "_renderAlert", lang => {
          var self = this,
              buttons = [{
            label: lang.initialize.confirm,
            className: 'btn-action',
            dataAttrs: {
              'ga-event': 'confirm'
            },
            onClick: self.state.alertContent.onClick
          }, {
            label: lang.initialize.cancel,
            dataAttrs: {
              'ga-event': 'cancel'
            },
            onClick: function (e) {
              self.setState({
                openAlert: false
              });
            }
          }],
              content = /*#__PURE__*/React.createElement(AlertDialog, {
            caption: this.state.alertContent.caption,
            message: this.state.alertContent.message,
            buttons: buttons
          });
          return true === this.state.openAlert ? /*#__PURE__*/React.createElement(Modal, {
            content: content
          }) : '';
        });

        this.state = {
          lang: args.state.lang,
          requirePrinterName: false,
          validPrinterName: true,
          validPrinterPassword: true,
          settingPrinter: initializeMachine.settingPrinter.get()
        };
      }

      componentDidMount() {
        DeviceMaster.registerUsbEvent('SETUP', this._monitorUsb);
        console.log('device to be set', this.state.settingPrinter);
      }

      render() {
        var lang = this.state.lang,
            wrapperClassName = {
          'initialization': true
        },
            invalidPrinterNameMessage = lang.initialize.invalid_device_name,
            oldPassword,
            printerNameClass,
            invalidPrinterNameClass,
            printerPasswordClass,
            content;
        printerNameClass = ReactCx.cx({
          'error': !this.state.validPrinterName
        });
        printerPasswordClass = ReactCx.cx({
          'error': !this.state.validPrinterPassword
        });
        invalidPrinterNameClass = ReactCx.cx({
          'error-message': true,
          'hide': this.state.validPrinterName
        });
        oldPassword = true === this.state.settingPrinter.password && '' === (this.state.settingPrinter.plaintext_password || '') && 'WIFI' === this.state.settingPrinter.from ? /*#__PURE__*/React.createElement("label", {
          className: "control",
          htmlFor: "printer-old-password"
        }, /*#__PURE__*/React.createElement("h4", {
          className: "input-head padleft"
        }, lang.initialize.set_machine_generic.old_password), /*#__PURE__*/React.createElement("input", {
          ref: "old_password",
          htmlFor: "printer-old-password",
          type: "password",
          className: printerPasswordClass,
          placeholder: lang.initialize.set_machine_generic.old_password
        })) : '';

        if (false === this.state.requirePrinterName) {
          invalidPrinterNameMessage = lang.initialize.require_device_name;
        }

        content = /*#__PURE__*/React.createElement("div", {
          className: "set-machine-generic text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("form", {
          className: "form h-form",
          onSubmit: this._handleSetPrinter
        }, /*#__PURE__*/React.createElement("h1", {
          className: "headline"
        }, lang.initialize.name_your_flux), /*#__PURE__*/React.createElement("div", {
          className: "controls"
        }, /*#__PURE__*/React.createElement("label", {
          className: "control",
          htmlFor: "printer-name"
        }, /*#__PURE__*/React.createElement("h4", {
          className: "input-head"
        }, lang.initialize.set_machine_generic.printer_name), /*#__PURE__*/React.createElement("input", {
          ref: "name",
          id: "printer-name",
          type: "text",
          className: printerNameClass,
          autoComplete: "off",
          autoFocus: true,
          defaultValue: this.state.settingPrinter.name,
          placeholder: lang.initialize.set_machine_generic.printer_name_placeholder
        }), /*#__PURE__*/React.createElement("span", {
          className: invalidPrinterNameClass
        }, invalidPrinterNameMessage)), oldPassword, /*#__PURE__*/React.createElement("label", {
          className: "control",
          htmlFor: "printer-password"
        }, /*#__PURE__*/React.createElement("h4", {
          className: "input-head"
        }, lang.initialize.set_machine_generic.password), /*#__PURE__*/React.createElement("input", {
          id: "printer-password",
          ref: "password",
          type: "password",
          className: printerPasswordClass,
          placeholder: lang.initialize.set_machine_generic.password_placeholder
        }))), /*#__PURE__*/React.createElement("div", {
          className: "btn-v-group"
        }, /*#__PURE__*/React.createElement("button", {
          type: "submit",
          className: "btn btn-action btn-large",
          "data-ga-event": "next"
        }, lang.initialize.next), /*#__PURE__*/React.createElement("a", {
          href: "#initialize/connect/setup-complete/with-usb",
          "data-ga-event": "skip",
          className: "btn btn-link btn-large"
        }, lang.initialize.skip))));
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});