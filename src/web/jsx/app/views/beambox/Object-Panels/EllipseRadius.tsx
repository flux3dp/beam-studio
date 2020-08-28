function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class EllipseRadius extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_rx_handler", val => {
        val = val / 2;

        if (this.state.isRatioPreserve) {
          const ry = val * (this.state.ry / this.state.rx);
          FnWrapper.update_ellipse_ry(ry);
          this.setState({
            ry: ry
          });
        }

        FnWrapper.update_ellipse_rx(val);
        this.setState({
          rx: val
        });
      });

      _defineProperty(this, "_update_ry_handler", val => {
        val = val / 2;

        if (this.state.isRatioPreserve) {
          const rx = val * (this.state.rx / this.state.ry);
          FnWrapper.update_ellipse_rx(rx);
          this.setState({
            rx: rx
          });
        }

        FnWrapper.update_ellipse_ry(val);
        this.setState({
          ry: val
        });
      });

      _defineProperty(this, "_ratio_handler", e => {
        this.setState({
          isRatioPreserve: e.target.checked
        });
      });

      this.state = {
        rx: this.props.rx,
        ry: this.props.ry,
        isRatioPreserve: false
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        rx: nextProps.rx,
        ry: nextProps.ry
      });
    }

    getValueCaption() {
      const rx = this.state.rx,
            ry = this.state.ry,
            units = localStorage.getItem('default-units') || 'mm';

      if (units === 'inches') {
        return `${Number(rx * 2 / 25.4).toFixed(3)}\", ${Number(ry * 2 / 25.4).toFixed(3)}\"`;
      } else {
        return `${rx * 2}, ${ry * 2} mm`;
      }
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
      }, LANG.ellipse_radius, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body  with-lock"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        max: Constant.dimension.getWidth() / Constant.dpmm,
        unit: "mm",
        defaultValue: this.state.rx * 2,
        getValue: this._update_rx_handler
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        max: Constant.dimension.getHeight() / Constant.dpmm,
        unit: "mm",
        defaultValue: this.state.ry * 2,
        getValue: this._update_ry_handler
      }))), /*#__PURE__*/React.createElement("div", {
        className: "lock"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: this.state.isRatioPreserve,
        id: "togglePreserveRatio",
        onChange: this._ratio_handler,
        hidden: true
      }), /*#__PURE__*/React.createElement("label", {
        htmlFor: "togglePreserveRatio",
        title: LANG.lock_desc
      }, /*#__PURE__*/React.createElement("div", null, "\u2510"), /*#__PURE__*/React.createElement("i", {
        className: this.state.isRatioPreserve ? "fa fa-lock locked" : "fa fa-unlock-alt unlocked"
      }), /*#__PURE__*/React.createElement("div", null, "\u2518"))))));
    }

  }

  ;
  EllipseRadius.propTypes = {
    rx: PropTypes.number.isRequired,
    ry: PropTypes.number.isRequired
  };
  return EllipseRadius;
});