define(['jquery', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n'], function ($, UnitInput, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class NestSpacingPanel extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        spacing: props.spacing
      };
    }

    _updateVal(val) {
      this.props.onValueChange(val);
      this.setState({
        spacing: val
      });
    }

    _getValueCaption() {
      const spacing = this.state.spacing,
            units = localStorage.getItem('default-units') | 'mm';

      if (units === 'inches') {
        return `${Number(spacing / 25.4).toFixed(3)}\"`;
      } else {
        return `${spacing} mm`;
      }
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
      }, LANG._nest.spacing, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control nest-spacing"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        unit: "mm",
        defaultValue: this.state.spacing,
        getValue: val => {
          this._updateVal(val);
        }
      }))))));
    }

  }

  ;
  return NestSpacingPanel;
});