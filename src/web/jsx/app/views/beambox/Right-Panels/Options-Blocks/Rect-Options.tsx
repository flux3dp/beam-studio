function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!views/beambox/Right-Panels/Options-Blocks/Infill-Block', 'jsx!widgets/Unit-Input-v2', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/actions/beambox/constant', 'helpers/i18n'], function (InFillBlock, UnitInput, DialogCaller, Alert, AlertConstants, Constant, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

  class RectOptions extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "handleRoundedCornerChange", val => {
        const {
          elem,
          updateDimensionValues
        } = this.props;
        val *= Constant.dpmm;
        svgCanvas.changeSelectedAttribute('rx', val, [elem]);
        updateDimensionValues({
          rx: val
        });
      });

      this.state = {};
    }

    renderRoundCornerBlock() {
      const {
        dimensionValues
      } = this.props;
      const unit = localStorage.getItem('default-units') || 'mm';
      const isInch = unit === 'inches';
      return /*#__PURE__*/React.createElement("div", {
        className: "option-block",
        key: "rounded-corner"
      }, /*#__PURE__*/React.createElement("div", {
        className: "label"
      }, LANG.rounded_corner), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        unit: isInch ? 'in' : 'mm',
        className: {
          'option-input': true
        },
        defaultValue: dimensionValues.rx / Constant.dpmm || 0,
        getValue: val => this.handleRoundedCornerChange(val)
      }));
    }

    render() {
      const {
        elem
      } = this.props;
      return /*#__PURE__*/React.createElement("div", {
        className: "rect-options"
      }, this.renderRoundCornerBlock(), /*#__PURE__*/React.createElement(InFillBlock, {
        elem: elem
      }));
    }

  }

  return RectOptions;
});