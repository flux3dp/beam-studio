function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class RectRoundedCorner extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_rx_handler", val => {
        FnWrapper.update_ellipse_rx(val);
        this.setState({
          rx: val
        });
      });

      _defineProperty(this, "getValueCaption", () => {
        const rx = this.state.rx,
              units = localStorage.getItem('default-units') || 'mm';

        if (units === 'inches') {
          return `${Number(rx / 25.4).toFixed(3)}\"`;
        } else {
          return `${rx} mm`;
        }
      });

      this.state = {
        rx: this.props.rx
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        rx: nextProps.rx
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
        defaultChecked: false
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.rounded_corner, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body  with-lock"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.radius), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        max: Constant.dimension.getWidth() / Constant.dpmm,
        unit: "mm",
        defaultValue: this.state.rx,
        getValue: this._update_rx_handler
      }))))));
    }

  }

  ;
  RectRoundedCorner.propTypes = {
    rx: PropTypes.number.isRequired
  };
  return RectRoundedCorner;
});