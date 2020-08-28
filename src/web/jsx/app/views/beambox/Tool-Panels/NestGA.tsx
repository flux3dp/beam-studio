function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n'], function ($, UnitInput, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class NestGAPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_updateGen", val => {
        this.props.updateNestOptions({
          generations: val
        });
        this.setState({
          generations: val
        });
      });

      _defineProperty(this, "_updatePopu", val => {
        this.props.updateNestOptions({
          population: val
        });
        this.setState({
          population: val
        });
      });

      this.state = {
        generations: props.nestOptions.generations,
        population: props.nestOptions.population
      };
    }

    _getValueCaption() {
      const {
        generations,
        population
      } = this.state;
      console.log(this.state);
      return `G${generations}, P${population}`;
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
      }, 'GA', /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "Generations"), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: 1,
        unit: "",
        decimal: 0,
        defaultValue: this.state.generations,
        getValue: val => {
          this._updateGen(val);
        }
      })), /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "Population"), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: 2,
        unit: "",
        decimal: 0,
        defaultValue: this.state.population,
        getValue: val => {
          this._updatePopu(val);
        }
      }))))));
    }

  }

  ;
  return NestGAPanel;
});