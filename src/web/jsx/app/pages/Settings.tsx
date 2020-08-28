function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'helpers/i18n', 'jsx!views/settings/Setting-General', 'plugins/classnames/index', 'app/app-settings', 'helpers/api/config'], function ($, i18n, GeneralSetting, ClassNames, settings, config) {
  'use strict';

  const React = require('react');

  return function (args) {
    args = args || {};

    class HomeView extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_handleDone", () => {
          location.hash = 'studio/' + (config().read('default-app') || 'beambox');
          location.reload();
        });

        _defineProperty(this, "_onLangChange", () => {
          this.setState({
            lang: i18n.get()
          });
        });

        _defineProperty(this, "_renderContent", () => {
          var content = {},
              view = args.child;

          content.general = () => {
            return /*#__PURE__*/React.createElement(GeneralSetting, {
              lang: this.state.lang,
              supported_langs: settings.i18n.supported_langs,
              onLangChange: this._onLangChange
            });
          };

          content.device = () => /*#__PURE__*/React.createElement(DeviceSetting, {
            lang: this.state.lang
          });

          if (typeof content[view] === 'undefined') {
            view = 'general';
          }

          return content[view]();
        });

        this.state = {
          lang: args.state.lang
        };
      }

      render() {
        var lang = this.state.lang,
            menu_item = 'nav-item',
            generalClass = ClassNames(menu_item, {
          active: args.child === 'general'
        }),
            deviceClass = ClassNames(menu_item, {
          active: args.child === 'device'
        }),
            // printerClass = ClassNames( menu_item, {active: 'printer' === args.child}),
        // tabContainerClass = ClassNames( 'tab-container', {'no-top-margin': !this.state.displayMenu}),
        tabs,
            footer;
        footer = /*#__PURE__*/React.createElement("footer", {
          className: "sticky-bottom"
        }, /*#__PURE__*/React.createElement("div", {
          className: "actions"
        }, /*#__PURE__*/React.createElement("a", {
          className: "btn btn-done",
          onClick: this._handleDone
        }, lang.settings.done)));
        return /*#__PURE__*/React.createElement("div", {
          className: "studio-container settings-studio"
        }, /*#__PURE__*/React.createElement("div", {
          className: "settings-gradient-overlay"
        }), this._renderContent());
      }

    }

    ;
    return HomeView;
  };
});