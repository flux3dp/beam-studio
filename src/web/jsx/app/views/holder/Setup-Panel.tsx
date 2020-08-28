function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'jsx!widgets/Unit-Input', 'jsx!widgets/Dialog-Menu', 'helpers/api/config', 'helpers/i18n'], function ($, UnitInput, DialogMenu, config, i18n) {
  'use strict';

  const React = require('react');

  let lang = i18n.lang;

  class SetupPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "isShading", () => {
        return false;
      });

      _defineProperty(this, "_saveLastestSet", () => {
        var self = this,
            refs = self.refs,
            opts = {
          liftHeight: refs.liftHeight.value(),
          drawHeight: refs.drawHeight.value(),
          speed: refs.speed.value()
        },
            state = {
          defaults: opts
        };
        config().write('draw-defaults', opts);
        self.setState(state);
      });

      _defineProperty(this, "openSubPopup", e => {
        this.refs.dialogMenu.toggleSubPopup(e);
      });

      _defineProperty(this, "_updateDefaults", (e, value) => {
        this._saveLastestSet();

        this.openSubPopup(e);
      });

      _defineProperty(this, "_renderLiftHeight", () => {
        var min = Math.max(5, this.state.defaults.drawHeight);
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.draw.pen_up_title
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.draw.pen_up), /*#__PURE__*/React.createElement("span", null, this.state.defaults.liftHeight), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mm)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "liftHeight",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.liftHeight,
            getValue: this._updateDefaults,
            min: min,
            max: 150
          }))
        };
      });

      _defineProperty(this, "_renderDrawHeight", () => {
        var max = Math.min(150, this.state.defaults.liftHeight);
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.draw.pen_down_title
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.draw.pen_down), /*#__PURE__*/React.createElement("span", null, this.state.defaults.drawHeight), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mm)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "drawHeight",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.drawHeight,
            getValue: this._updateDefaults,
            min: 5,
            max: max
          }))
        };
      });

      _defineProperty(this, "_renderSpeed", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.draw.speed_title
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.draw.speed), /*#__PURE__*/React.createElement("span", null, this.state.defaults.speed), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mms)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "speed",
            defaultUnit: "mm/s",
            defaultUnitType: "speed",
            defaultValue: this.state.defaults.speed,
            getValue: this._updateDefaults,
            min: 0.8,
            max: 150
          }))
        };
      });

      this.state = {
        defaults: this.props.defaults
      };
    }

    render() {
      var liftHeight = this._renderLiftHeight(),
          drawHeight = this._renderDrawHeight(),
          speed = this._renderSpeed(),
          items = [liftHeight, drawHeight, speed];

      return /*#__PURE__*/React.createElement("div", {
        className: "setup-panel operating-panel"
      }, /*#__PURE__*/React.createElement(DialogMenu, {
        ref: "dialogMenu",
        items: items
      }));
    }

  }

  ;
  SetupPanel.defaultProps = {
    defaults: {},
    imageFormat: 'svg' // svg, bitmap

  };
  return SetupPanel;
});