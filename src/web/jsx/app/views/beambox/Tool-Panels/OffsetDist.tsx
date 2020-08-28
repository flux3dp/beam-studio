define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class OffsetDistPanel extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        distance: props.distance
      };
    }

    _updateDist(val) {
      this.props.onValueChange(val);
      this.setState({
        distance: val
      });
    }

    _getValueCaption() {
      const dist = this.state.distance,
            units = localStorage.getItem('default-units') || 'mm';

      if (units === 'inches') {
        return `${Number(dist / 25.4).toFixed(3)}\"`;
      } else {
        return `${dist} mm`;
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
      }, LANG._offset.dist, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control offset-dist"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        unit: "mm",
        defaultValue: this.state.distance,
        getValue: val => {
          this._updateDist(val);
        }
      }))))));
    }

  }

  ;
  return OffsetDistPanel;
});