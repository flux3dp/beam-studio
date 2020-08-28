function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class EllipsePosition extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_cx_handler", val => {
        FnWrapper.update_ellipse_cx(val);
        this.setState({
          cx: val
        });
      });

      _defineProperty(this, "_update_cy_handler", val => {
        FnWrapper.update_ellipse_cy(val);
        this.setState({
          cy: val
        });
      });

      _defineProperty(this, "getValueCaption", () => {
        const cx = this.state.cx,
              cy = this.state.cy,
              units = localStorage.getItem('default-units') || 'mm';

        if (units === 'inches') {
          return `${Number(cx / 25.4).toFixed(3)}\", ${Number(cy / 25.4).toFixed(3)}\"`;
        } else {
          return `${cx}, ${cy} mm`;
        }
      });

      this.state = {
        cx: this.props.cx,
        cy: this.props.cy
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        cx: nextProps.cx,
        cy: nextProps.cy
      });
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "object-panel"
      }, /*#__PURE__*/React.createElement("label", {
        className: "controls accordion",
        onClick: () => {
          FnWrapper.resetObjectPanel();
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "accordion-switcher",
        defaultChecked: true
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.center, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        defaultValue: this.state.cx,
        getValue: this._update_cx_handler
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        defaultValue: this.state.cy,
        getValue: this._update_cy_handler
      })))));
    }

  }

  ;
  EllipsePosition.propTypes = {
    cx: PropTypes.number.isRequired,
    cy: PropTypes.number.isRequired
  };
  return EllipsePosition;
});