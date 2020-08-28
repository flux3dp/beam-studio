function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactClassset', 'app/actions/initialize-machine', 'jsx!widgets/Modal', 'jsx!widgets/List', 'jsx!widgets/Button-Group', 'jsx!widgets/Alert', 'helpers/api/usb-config', 'helpers/api/upnp-config', 'app/actions/progress-actions', 'app/constants/progress-constants', 'app/actions/alert-actions', 'app/stores/alert-store'], function ($, ReactCx, initializeMachine, Modal, ListView, ButtonGroup, Alert, usbConfig, upnpConfig, ProgressActions, ProgressConstants, AlertActions, AlertStore, DeviceErrorHandler) {
  'use strict';

  const React = require('react');

  const ReactDOM = require('react-dom');

  var actionMap = {
    BACK_TO_SET_PASSWARD: 'BACK_TO_SET_PASSWARD',
    AP_MODE: 'AP_MODE',
    SET_WIFI_WITHOUT_PASSWORD: 'SET_WIFI_WITHOUT_PASSWORD'
  },
      usbSocket,
      globalWifiAPI;
  return function (args) {
    var _temp;

    args = args || {};
    return _temp = class WifiSelect extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "componentWillUnmount", () => {
          if ('undefined' !== typeof globalWifiAPI) {
            globalWifiAPI.connection.close();
          }
        });

        _defineProperty(this, "_onCancel", id => {
          if ('#initialize/connect/select' === location.hash) {
            usbSocket.close();
            usbSocket = usbConfig();
            location.hash = 'initialize/connect/connect-machine';
          }
        });

        _defineProperty(this, "_afterStopWifiScanning", args => {
          var self = this;
          ProgressActions.close();

          switch (args.action) {
            case actionMap.BACK_TO_SET_PASSWARD:
              self._goToSetPassword();

              break;

            case actionMap.AP_MODE:
              self._setApMode();

              break;

            case actionMap.SET_WIFI_WITHOUT_PASSWORD:
              self._setWifiWithoutPassword();

              break;
          }
        });

        _defineProperty(this, "_goToSetPassword", () => {
          // var settingWifi = initializeMachine.settingWifi.get();
          if ('WIFI' === this.state.settingPrinter.from) {
            this._settingWifiViaWifi();
          } else {
            location.hash = '#initialize/connect/set-password';
          }
        });

        _defineProperty(this, "_setApMode", () => {
          var self = this,
              settingPrinter = self.state.settingPrinter,
              apName = self.state.apName,
              apPass = self.state.apPass;
          settingPrinter.apName = apName;
          initializeMachine.settingPrinter.set(settingPrinter);

          if ('WIFI' === settingPrinter.from) {
            self._setApModeViaWifi(apName, apPass);
          } else {
            self._setApModeViaUsb(apName, apPass);
          }
        });

        _defineProperty(this, "_setApModeViaUsb", (name, pass) => {
          var self = this,
              lang = self.state.lang;
          usbSocket.setAPMode(name, pass, {
            onSuccess: function (response) {
              location.hash = 'initialize/connect/setup-complete/station-mode';
            },
            onError: function (response) {
              AlertActions.showPopupError('ap-mode-fail', lang.initialize.errors.select_wifi.ap_mode_fail);
            }
          });
        });

        _defineProperty(this, "_setApModeViaWifi", (name, pass) => {
          var self = this,
              lang = self.state.lang,
              settingPrinter = self.state.settingPrinter;
          globalWifiAPI.setAPMode(name, pass).done(function (response) {
            location.hash = 'initialize/connect/setup-complete/station-mode';
          }).fail(function (response) {
            AlertActions.showPopupError('ap-mode-fail', lang.initialize.errors.select_wifi.ap_mode_fail);
          });
        });

        _defineProperty(this, "_settingWifiViaWifi", () => {
          var settingPrinter = this.state.settingPrinter,
              settingWifi = initializeMachine.settingWifi.get();
          settingPrinter.apName = settingWifi.ssid;
          initializeMachine.settingPrinter.set(settingPrinter);
          ProgressActions.open(ProgressConstants.NONSTOP);
          globalWifiAPI.setWifiNetwork(settingWifi, settingWifi.plain_password).always(function () {
            ProgressActions.close();
          }).done(function (response) {
            console.log('done', response);
            location.hash = '#initialize/connect/notice-from-device';
          }).fail(function (response) {
            console.log('fail', response);
          });
        });

        _defineProperty(this, "_setWifiWithoutPassword", () => {
          var settingPrinter = self.state.settingPrinter,
              settingWifi = initializeMachine.settingWifi.get();

          if ('WIFI' === settingPrinter.from) {
            settingPrinter.apName = settingWifi.ssid;
            initializeMachine.settingPrinter.set(settingPrinter);

            this._settingWifiViaWifi();
          } else {
            location.hash = '#initialize/connect/setup-complete/with-wifi';
          }
        });

        _defineProperty(this, "_handleSetPassword", e => {
          e.preventDefault();
          var self = this,
              wifi = initializeMachine.settingWifi.get();
          wifi.plain_password = ReactDOM.findDOMNode(self.refs.password).value;
          initializeMachine.settingWifi.set(wifi);

          self._stopScan(actionMap.BACK_TO_SET_PASSWARD);
        });

        _defineProperty(this, "_confirmWifi", e => {
          e.preventDefault();
          var settingWifi = initializeMachine.settingWifi.get();

          if (true === settingWifi.password) {
            this._stopScan();

            this.setState({
              openPassword: true
            });
          } else {
            this._stopScan(actionMap.SET_WIFI_WITHOUT_PASSWORD);
          }
        });

        _defineProperty(this, "_stopScan", action => {
          this.action = action;
          this.deferred.notify('STOP_SCAN');
        });

        _defineProperty(this, "_startScan", () => {
          this.action = '';
          this.deferred.notify('SCAN_WIFI');
        });

        _defineProperty(this, "_selectWifi", e => {
          var $li = $(e.target).parents('label'),
              meta = $li.data('meta');
          this.setState({
            selectedWifi: true
          });
          initializeMachine.settingWifi.set(meta);
        });

        _defineProperty(this, "_checkApModeSetting", e => {
          var name = ReactDOM.findDOMNode(this.refs.ap_mode_name).value,
              pass = ReactDOM.findDOMNode(this.refs.ap_mode_password).value,
              apModeNameIsVaild = /^[a-zA-Z0-9 \-\.\_\!\,\[\]\(\)]+$/g.test(name),
              apModePassIsVaild = /^[a-zA-Z0-9 \-\.\_\!\,\[\]\(\)]{8,}$/g.test(pass);
          this.setState({
            apName: name,
            apPass: pass,
            apModeNameIsVaild: apModeNameIsVaild,
            apModePassIsVaild: apModePassIsVaild
          });
          return apModeNameIsVaild && apModePassIsVaild;
        });

        _defineProperty(this, "_setAsStationMode", e => {
          e.preventDefault();

          if (this._checkApModeSetting()) {
            this.setState({
              isFormSubmitted: true
            });

            this._stopScan(actionMap.AP_MODE);
          }
        });

        _defineProperty(this, "_joinNetwork", e => {
          e.preventDefault();
          var ssid = ReactDOM.findDOMNode(this.refs.network_name).value,
              wepkey = ReactDOM.findDOMNode(this.refs.network_password).value,
              security = ReactDOM.findDOMNode(this.refs.network_security).value;
          let wifi = {
            ssid,
            security
          };
          initializeMachine.settingWifi.set(wifi);

          this._stopScan();

          usbSocket.joinWifiNetwork(wifi, wepkey, true).then(result => {
            if (result.status === 'ok') {
              location.hash = '#initialize/connect/notice-from-device';
            }
          }).fail(error => {
            console.log(error);
          });
        });

        _defineProperty(this, "_renderPasswordForm", lang => {
          var self = this,
              settingWifi = initializeMachine.settingWifi.get(),
              buttons = [{
            label: lang.initialize.connect,
            className: 'btn-action btn-large',
            type: 'submit',
            dataAttrs: {
              'ga-event': 'set-password-to-connect-to-wifi'
            },
            onClick: self._handleSetPassword
          }, {
            label: lang.initialize.cancel,
            className: 'btn-link btn-large',
            dataAttrs: {
              'ga-event': 'cancel-connect-to-wifi'
            },
            onClick: function (e) {
              e.preventDefault();

              self._startScan();

              self.setState({
                openPassword: false
              });
            }
          }],
              content = /*#__PURE__*/React.createElement("form", {
            className: "form form-wifi-password",
            onSubmit: self._handleSetPassword
          }, /*#__PURE__*/React.createElement("div", {
            className: "notice"
          }, /*#__PURE__*/React.createElement("p", null, "\u201C", settingWifi.ssid, "\u201D"), /*#__PURE__*/React.createElement("p", null, lang.initialize.requires_wifi_password)), /*#__PURE__*/React.createElement("input", {
            ref: "password",
            type: "password",
            className: "password-input",
            placeholder: "",
            defaultValue: "",
            autoFocus: true
          }), /*#__PURE__*/React.createElement(ButtonGroup, {
            className: "btn-v-group",
            buttons: buttons
          }));
          return true === this.state.openPassword ? /*#__PURE__*/React.createElement(Modal, {
            content: content
          }) : '';
        });

        _defineProperty(this, "_renderApModeForm", lang => {
          var self = this,
              closeForm = function (e) {
            self.setState({
              openApModeForm: false,
              openJoinNetworkForm: false
            });
          },
              classSet = ReactCx.cx,
              nameClass = classSet({
            'error': false === self.state.apModeNameIsVaild
          }),
              passClass = classSet({
            'error': false === self.state.apModePassIsVaild
          }),
              submitButtonClass = classSet({
            'btn btn-action btn-large': true,
            'btn-disabled': self.state.isFormSubmitted
          }),
              content = /*#__PURE__*/React.createElement("form", {
            className: "form form-ap-mode",
            onSubmit: self._setAsStationMode
          }, /*#__PURE__*/React.createElement("h2", null, lang.initialize.set_machine_generic.create_network), /*#__PURE__*/React.createElement("label", {
            className: "h-control"
          }, /*#__PURE__*/React.createElement("span", {
            className: "header"
          }, lang.initialize.set_machine_generic.ap_mode_name), /*#__PURE__*/React.createElement("input", {
            ref: "ap_mode_name",
            type: "text",
            className: nameClass,
            placeholder: "",
            defaultValue: self.state.settingPrinter.name,
            autoFocus: true,
            required: true,
            pattern: "^.+$",
            maxLength: "32",
            title: lang.initialize.set_machine_generic.ap_mode_name_format,
            placeholder: lang.initialize.set_machine_generic.ap_mode_name_placeholder,
            onChange: self._checkApModeSetting
          })), /*#__PURE__*/React.createElement("label", {
            className: "h-control"
          }, /*#__PURE__*/React.createElement("span", {
            className: "header"
          }, lang.initialize.set_machine_generic.ap_mode_pass), /*#__PURE__*/React.createElement("input", {
            ref: "ap_mode_password",
            type: "password",
            className: passClass,
            placeholder: "",
            defaultValue: "",
            required: true,
            pattern: "^.{8,}$",
            title: lang.initialize.set_machine_generic.ap_mode_pass_format,
            placeholder: lang.initialize.set_machine_generic.ap_mode_pass_placeholder,
            onChange: self._checkApModeSetting
          })), /*#__PURE__*/React.createElement("div", {
            className: "button-group btn-v-group"
          }, /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large",
            type: "submit"
          }, lang.initialize.confirm), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large btn-link",
            onClick: closeForm
          }, lang.initialize.cancel)));

          return true === this.state.openApModeForm ? /*#__PURE__*/React.createElement(Modal, {
            content: content
          }) : '';
        });

        _defineProperty(this, "_renderJoinNetworkForm", lang => {
          var self = this,
              closeForm = function (e) {
            self.setState({
              openJoinNetworkForm: false
            });
          },
              classSet = ReactCx.cx,
              nameClass = classSet({
            'error': false === self.state.apModeNameIsVaild
          }),
              passClass = classSet({
            'error': false === self.state.apModePassIsVaild
          }),
              submitButtonClass = classSet({
            'btn btn-action btn-large': true,
            'btn-disabled': self.state.isFormSubmitted
          }),
              content = /*#__PURE__*/React.createElement("form", {
            className: "form form-ap-mode"
          }, /*#__PURE__*/React.createElement("h2", null, lang.initialize.set_machine_generic.join_network), /*#__PURE__*/React.createElement("label", {
            className: "h-control"
          }, /*#__PURE__*/React.createElement("span", {
            className: "header"
          }, lang.initialize.set_machine_generic.ap_mode_name), /*#__PURE__*/React.createElement("input", {
            ref: "network_name",
            type: "text",
            className: nameClass,
            autoFocus: true,
            required: true,
            pattern: "^.+$",
            maxLength: "32"
          })), /*#__PURE__*/React.createElement("label", {
            className: "h-control"
          }, /*#__PURE__*/React.createElement("span", {
            className: "header"
          }, lang.initialize.set_machine_generic.ap_mode_pass), /*#__PURE__*/React.createElement("input", {
            ref: "network_password",
            type: "password",
            className: passClass,
            required: true,
            pattern: "^.{8,}$"
          })), /*#__PURE__*/React.createElement("label", {
            className: "h-control"
          }, /*#__PURE__*/React.createElement("span", {
            className: "header"
          }, lang.initialize.set_machine_generic.security), /*#__PURE__*/React.createElement("select", {
            ref: "network_security",
            className: "security"
          }, /*#__PURE__*/React.createElement("option", {
            value: "NONE"
          }, "NONE"), /*#__PURE__*/React.createElement("option", {
            value: "WEP"
          }, "WEP"), /*#__PURE__*/React.createElement("option", {
            value: "WPA2-PSK"
          }, "WPA2-PSK"))), /*#__PURE__*/React.createElement("div", {
            className: "button-group btn-v-group"
          }, /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large",
            type: "submit",
            onClick: this._joinNetwork
          }, lang.initialize.confirm), /*#__PURE__*/React.createElement("button", {
            className: "btn btn-action btn-large btn-link",
            onClick: closeForm
          }, lang.initialize.cancel)));

          return this.state.openJoinNetworkForm ? /*#__PURE__*/React.createElement(Modal, {
            content: content
          }) : '';
        });

        _defineProperty(this, "_renderWifiItem", wifi => {
          var settingWifi = initializeMachine.settingWifi.get(),
              lockClassName = 'fa ' + (true === wifi.password ? 'fa-lock' : ''),
              meta = JSON.stringify(wifi);
          return /*#__PURE__*/React.createElement("label", {
            "data-meta": meta
          }, /*#__PURE__*/React.createElement("input", {
            type: "radio",
            name: "wifi-spot",
            value: wifi.ssid,
            defaultChecked: settingWifi.ssid === wifi.ssid
          }), /*#__PURE__*/React.createElement("div", {
            className: "row-fluid"
          }, /*#__PURE__*/React.createElement("span", {
            className: "wifi-ssid"
          }, wifi.ssid), /*#__PURE__*/React.createElement("span", {
            className: lockClassName
          }), /*#__PURE__*/React.createElement("span", {
            className: "wifi-signal-strength fa fa-wifi"
          })));
        });

        _defineProperty(this, "_renderWifiOptions", lang => {
          return this.state.wifiOptions.length > 0 ? /*#__PURE__*/React.createElement(ListView, {
            ref: "wifiList",
            className: "pure-list wifi-list clearfix " + (this.state.wifiOptions.length > 0 ? 'active' : ''),
            ondblclick: this._confirmWifi,
            onClick: this._selectWifi,
            items: this.state.wifiOptions
          }) : /*#__PURE__*/React.createElement("div", {
            className: "wifi-list"
          }, /*#__PURE__*/React.createElement("div", {
            className: "spinner-roller absolute-center"
          }));
        });

        this.action = '';
        this.deferred = $.Deferred();
        this.state = {
          lang: args.state.lang,
          wifiOptions: [],
          selectedWifi: false,
          openAlert: false,
          openPassword: false,
          openApModeForm: false,
          apName: initializeMachine.settingPrinter.get().name,
          apPass: '',
          alertContent: {},
          settingPrinter: initializeMachine.settingPrinter.get(),
          apModeNameIsVaild: true,
          apModePassIsVaild: true,
          isFormSubmitted: false
        };
      }

      componentDidMount() {
        var self = this,
            wifiOptions = [],
            settingWifi = initializeMachine.settingWifi.get(),
            settingPrinter = self.state.settingPrinter,
            timer,
            getWifi = function () {
          wifiOptions = [];
          usbSocket.getWifiNetwork().done(function (response) {
            var item;
            response.items = response.items.sort(function (a, b) {
              var aSSid = a.ssid.toUpperCase(),
                  bSsid = b.ssid.toUpperCase();

              if (aSSid === bSsid) {
                return 0;
              } else if (aSSid > bSsid) {
                return 1;
              } else {
                return -1;
              }
            });
            response.items.forEach(function (el) {
              item = self._renderWifiItem(el);
              wifiOptions.push({
                value: el.ssid,
                label: {
                  item
                }
              });

              if (settingWifi.ssid === el.ssid) {
                self.setState({
                  selectedWifi: true
                });
              }

              self.setState({
                wifiOptions: wifiOptions
              });
            });
            self.deferred.notify('SCAN_WIFI');
          }).fail(function (response) {
            self.deferred.reject(response);
          });
        };

        self.deferred.progress(function (nextAction) {
          switch (nextAction) {
            case 'SCAN_WIFI':
              clearTimeout(this.t);
              this.t = setTimeout(() => {
                getWifi();
              }, 5000);
              break;

            case 'STOP_SCAN':
              clearTimeout(this.t);
              ProgressActions.open(ProgressConstants.NONSTOP);

              self._afterStopWifiScanning({
                action: self.action
              });

              break;
          }
        }).fail(function (response) {
          AlertActions.showPopupError('wifi-scan-error', DeviceErrorHandler.translate(response.error));
        });

        if ('WIFI' === settingPrinter.from) {
          usbSocket = upnpConfig(settingPrinter.uuid); // defined at top

          globalWifiAPI = upnpConfig(settingPrinter.uuid);
        } else {
          usbSocket = usbConfig();
        }

        getWifi();
        AlertStore.onCancel(self._onCancel);
      } // Private methods


      render() {
        var self = this,
            lang = self.state.lang,
            wrapperClassName = {
          'initialization': true
        },
            items = self._renderWifiOptions(lang),
            buttons = [{
          label: lang.initialize.next,
          className: 'btn-action btn-large btn-set-client-mode' + (true === self.state.selectedWifi ? '' : ' btn-disabled'),
          dataAttrs: {
            'ga-event': 'pickup-a-wifi'
          },
          onClick: self._confirmWifi
        }, {
          label: lang.initialize.set_machine_generic.set_station_mode,
          className: 'btn-action btn-large btn-set-station-mode',
          dataAttrs: {
            'ga-event': 'set-as-station-mode'
          },
          onClick: function (e) {
            self.setState({
              openApModeForm: true,
              isFormSubmitted: false
            });
          }
        }, {
          label: lang.initialize.set_machine_generic.join_network,
          className: 'btn-action btn-large btn-set-station-mode',
          dataAttrs: {
            'ga-event': 'set-as-station-mode'
          },
          onClick: function (e) {
            self._stopScan();

            self.setState({
              openJoinNetworkForm: true,
              isFormSubmitted: false
            });
          }
        }, {
          label: lang.initialize.skip,
          className: 'btn-link btn-large',
          type: 'link',
          dataAttrs: {
            'ga-event': 'use-device-with-usb'
          },
          onClick: e => {
            this._stopScan();
          },
          href: '#initialize/connect/setup-complete/with-usb'
        }],
            passwordForm = this._renderPasswordForm(lang),
            apModeForm = this._renderApModeForm(lang),
            joinNetworkForm = this._renderJoinNetworkForm(lang),
            content = /*#__PURE__*/React.createElement("div", {
          className: "select-wifi text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
          className: "headline"
        }, lang.initialize.wifi_setup), /*#__PURE__*/React.createElement("p", {
          className: "notice"
        }, lang.initialize.select_preferred_wifi), items, /*#__PURE__*/React.createElement(ButtonGroup, {
          className: "btn-v-group",
          buttons: buttons
        })), passwordForm, apModeForm, joinNetworkForm);

        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});