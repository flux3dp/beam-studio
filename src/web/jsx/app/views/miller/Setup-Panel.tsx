function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'jsx!widgets/Select', 'jsx!widgets/List', 'jsx!widgets/Modal', 'jsx!views/laser/Advanced-Panel', 'jsx!widgets/Text-Toggle', 'jsx!widgets/Unit-Input', 'jsx!widgets/Button-Group', 'jsx!widgets/Alert', 'jsx!widgets/Dialog-Menu', 'helpers/api/config', 'helpers/i18n', 'helpers/round', 'plugins/classnames/index'], function ($, SelectView, List, Modal, AdvancedPanel, TextToggle, UnitInput, ButtonGroup, Alert, DialogMenu, ConfigHelper, i18n, round, ClassNames) {
  'use strict';

  const React = require('react');

  let Config = ConfigHelper(),
      lang = i18n.lang;

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
          zOffset: refs.zOffset.value(),
          overcut: refs.overcut.value(),
          speed: refs.speed.value(),
          repeat: refs.repeat.value(),
          stepHeight: refs.stepHeight.value()
        },
            state = {
          defaults: opts
        };
        Config.write('mill-defaults', opts);
        self.setState(state);
      });

      _defineProperty(this, "openSubPopup", e => {
        this.refs.dialogMenu.toggleSubPopup(e);
      });

      _defineProperty(this, "_updateDefaults", (e, value) => {
        this._saveLastestSet();

        this.openSubPopup(e);
      });

      _defineProperty(this, "_renderZOffset", () => {
        var min = -1;
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.cut.zOffsetTip
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.cut.zOffset), /*#__PURE__*/React.createElement("span", null, this.state.defaults.zOffset), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mm)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "zOffset",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.zOffset,
            getValue: this._updateDefaults,
            min: min,
            max: 150
          }))
        };
      });

      _defineProperty(this, "_renderOvercut", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.cut.overcutTip
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.cut.overcut), /*#__PURE__*/React.createElement("span", null, this.state.defaults.overcut), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mm)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "overcut",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.overcut,
            getValue: this._updateDefaults,
            min: 0,
            max: 10
          }))
        };
      });

      _defineProperty(this, "_renderSpeed", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.cut.speedTip
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.cut.speed), /*#__PURE__*/React.createElement("span", null, this.state.defaults.speed), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mms)),
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

      _defineProperty(this, "_renderRepeat", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.cut.repeatTip
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.mill.repeat), /*#__PURE__*/React.createElement("span", null, this.state.defaults.repeat)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "repeat",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.repeat,
            getValue: this._updateDefaults,
            min: 0,
            max: 50
          }))
        };
      });

      _defineProperty(this, "_renderStepHeight", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.cut.repeatTip
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.mill.stepHeight), /*#__PURE__*/React.createElement("span", null, this.state.defaults.stepHeight), /*#__PURE__*/React.createElement("span", null, lang.draw.units.mm)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            ref: "stepHeight",
            defaultUnit: "mm",
            defaultValue: this.state.defaults.stepHeight,
            getValue: this._updateDefaults,
            min: 0,
            max: 50
          }))
        };
      });

      this.state = {
        defaults: this.props.defaults
      };
    }

    render() {
      let items = [this._renderZOffset(), this._renderOvercut(), this._renderSpeed(), this._renderRepeat(), this._renderStepHeight()];
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