function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/sprintf', 'app/actions/initialize-machine', 'helpers/api/config', 'helpers/api/usb-config', 'jsx!widgets/Modal', 'helpers/device-master'], function (sprintf, initializeMachine, config, usbConfig, Modal, DeviceMaster) {
  'use strict';

  return function (args) {
    var _temp;

    const React = require('react');

    args = args || {};
    return _temp = class WifiSetupComplete extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_goBack", e => {
          history.go(-1);
        });

        _defineProperty(this, "_onStart", e => {
          initializeMachine.completeSettingUp(true);
        });

        _defineProperty(this, "_getArticle", (lang, method) => {
          var settingPrinter = initializeMachine.settingPrinter.get(),
              article = {};

          switch (method) {
            case 'with-wifi':
              article = {
                caption: lang.initialize.setting_completed.brilliant,
                content: lang.initialize.setting_completed.begin_journey
              };
              break;

            case 'with-usb':
              article = {
                caption: lang.initialize.setting_completed.great,
                content: lang.initialize.setting_completed.upload_via_usb
              };
              break;

            case 'station-mode':
              article = {
                caption: sprintf(lang.initialize.setting_completed.is_ready, settingPrinter.name || ''),
                content: sprintf(lang.initialize.setting_completed.station_ready_statement, settingPrinter.name)
              };
              break;
          }

          return article;
        });

        this.state = args.state;
      }

      componentDidMount() {
        if ('with-usb' !== this.props.other) {
          initializeMachine.completeSettingUp(false);
        }

        DeviceMaster.unregisterUsbEvent('SETUP');
      }

      render() {
        const method = this.props.other || 'with-wifi';

        var wrapperClassName = {
          'initialization': true
        },
            lang = this.state.lang,
            article = this._getArticle(lang, method);

        function createMarkup() {
          return {
            __html: article.content
          };
        }

        var startText = 'with-usb' === method ? lang.initialize.setting_completed.ok : lang.initialize.setting_completed.start,
            backToWifiSelect = 'with-usb' === method ? /*#__PURE__*/React.createElement("button", {
          className: "btn btn-link btn-large",
          "data-ga-event": "back",
          onClick: this._goBack
        }, lang.initialize.setting_completed.back) : '',
            content = /*#__PURE__*/React.createElement("div", {
          className: "setting-completed text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("h1", {
          className: "headline"
        }, article.caption), /*#__PURE__*/React.createElement("p", {
          className: "notice",
          dangerouslySetInnerHTML: createMarkup()
        }), /*#__PURE__*/React.createElement("div", {
          className: "btn-v-group"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-large",
          "data-ga-event": "start",
          onClick: this._onStart
        }, startText), backToWifiSelect));
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});