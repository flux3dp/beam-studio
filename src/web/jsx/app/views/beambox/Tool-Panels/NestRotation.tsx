define(['jquery', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n'], function ($, UnitInput, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class NestRotationPanel extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        rotations: props.rotations
      };
    }

    _updateVal(val) {
      this.props.onValueChange(val);
      this.setState({
        rotations: val
      });
    }

    _getValueCaption() {
      const rotations = this.state.rotations;
      return `${rotations}`;
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
      }, LANG._nest.rotations, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control nest-rotations"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: 1,
        decimal: 0,
        unit: "",
        defaultValue: this.state.rotations,
        getValue: val => {
          this._updateVal(val);
        }
      }))))));
    }

  }

  ;
  return NestRotationPanel;
});