function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, UnitInput, i18n, Constant) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class Interval extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_dx_handler", val => {
        this.setState({
          dx: val
        });
        let distance = this.state;
        distance.dx = val;
        this.props.onValueChange(distance);
      });

      _defineProperty(this, "_update_dy_handler", val => {
        this.setState({
          dy: val
        });
        let distance = this.state;
        distance.dy = val;
        this.props.onValueChange(distance);
      });

      _defineProperty(this, "getValueCaption", () => {
        const dx = this.state.dx,
              dy = this.state.dy,
              units = localStorage.getItem('default-units') || 'mm';

        if (units === 'inches') {
          return `${Number(dx / 25.4).toFixed(3)}\", ${Number(dy / 25.4).toFixed(3)}\"`;
        } else {
          return `${dx}, ${dy} mm`;
        }
      });

      this.state = {
        dx: this.props.dx,
        dy: this.props.dy,
        onValueChange: this.props.onValueChange
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        dx: nextProps.dx,
        dy: nextProps.dy,
        onValueChange: nextProps.onValueChange
      });
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "tool-panel"
      }, /*#__PURE__*/React.createElement("label", {
        className: "controls accordion"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "accordion-switcher",
        defaultChecked: true
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.array_interval, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.dx), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        max: Constant.dimension.getWidth() / Constant.dpmm,
        unit: "mm",
        defaultValue: this.state.dx,
        getValue: this._update_dx_handler
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.dy), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        max: Constant.dimension.getHeight() / Constant.dpmm,
        unit: "mm",
        defaultValue: this.state.dy,
        getValue: this._update_dy_handler
      })))));
    }

  }

  ;
  Interval.propTypes = {
    dx: PropTypes.number.isRequired,
    dy: PropTypes.number.isRequired,
    onValueChange: PropTypes.func
  };
  return Interval;
});