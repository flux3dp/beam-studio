function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactClassset', 'helpers/api/config', 'jsx!widgets/List', 'jsx!widgets/Dialog-Menu'], function ($, ReactCx, config, List, DialogMenu) {
  'use strict';

  const React = require('react');

  class SetupPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "openSubPopup", e => {
        this.refs.dialogMenu.toggleSubPopup(e);
      });

      _defineProperty(this, "getSettings", () => {
        return this.state.defaults;
      });

      _defineProperty(this, "_onPickupResolution", e => {
        var $me = $(e.target).parents('li'),
            settings = {
          resolution: $me.data('meta')
        };
        this.props.getSetting(settings);
        config().write('scan-defaults', settings);
        this.setState({
          defaults: settings
        });
        this.openSubPopup(e);
      });

      _defineProperty(this, "_getResolutionOptions", lang => {
        var resolution = JSON.parse(JSON.stringify(lang.scan.resolution)),
            options = [];
        resolution.forEach(function (opt, i) {
          options.push({
            data: opt,
            label: /*#__PURE__*/React.createElement("div", {
              className: `resolution-item resolution-${opt.text.toLowerCase()}`
            }, /*#__PURE__*/React.createElement("span", {
              className: "caption"
            }, opt.text), /*#__PURE__*/React.createElement("span", {
              className: "time"
            }, opt.time))
          });
        }); // for avoid a strange issue happened on windows 64 that display 
        // "TypeError": Cannot read property 'text' of undefined. cause scan function crashed.

        try {
          var quality = this.state.defaults.resolution.text;
        } catch (err) {
          console.log(err);
          var quality = '';
        }

        return {
          label: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
            className: "caption resolution"
          }, quality), /*#__PURE__*/React.createElement("span", null, lang.scan.quality)),
          content: /*#__PURE__*/React.createElement(List, {
            items: options,
            onClick: this._onPickupResolution
          })
        };
      });

      _defineProperty(this, "_getCalibrate", lang => {
        return {
          label: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
            className: "btn btn-default btn-calibrate caption",
            "data-ga-event": "calibrate",
            onClick: this.props.onCalibrate
          }, lang.scan.calibrate))
        };
      });

      var defaultSettings = {
        resolution: this.props.lang.scan.resolution[0]
      },
          defaults = config().read('scan-defaults') || defaultSettings;
      this.state = {
        defaults: defaults
      };
    }

    render() {
      var props = this.props,
          lang = props.lang,
          resolutionOptions = this._getResolutionOptions(lang),
          calibrate = this._getCalibrate(lang),
          className = props.className,
          items = [resolutionOptions, calibrate];

      className['setup-panel'] = true;
      return /*#__PURE__*/React.createElement("div", {
        className: ReactCx.cx(className)
      }, /*#__PURE__*/React.createElement(DialogMenu, {
        ref: "dialogMenu",
        items: items
      }));
    }

  }

  ;
  SetupPanel.defaultProps = {
    className: {},
    lang: {},
    getSetting: function (setting) {},
    onCalibrate: function () {}
  };
  return SetupPanel;
});