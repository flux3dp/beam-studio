function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  'use strict';

  const React = require('react');

  ;
  const LANG = i18n.lang.beambox.object_panels;

  class PositionPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_x_handler", x => {
        if (this.props.type === 'use') {
          svgCanvas.setSvgElemPosition('x', x * Constant.dpmm);
        } else {
          FnWrapper.update_selected_x(x);
        }

        this.setState({
          x: x
        });
      });

      _defineProperty(this, "_update_y_handler", y => {
        if (this.props.type === 'use') {
          svgCanvas.setSvgElemPosition('y', y * Constant.dpmm);
        } else {
          FnWrapper.update_selected_y(y);
        }

        this.setState({
          y: y
        });
      });

      this.state = {
        x: this.props.x,
        y: this.props.y
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        x: nextProps.x,
        y: nextProps.y
      });
    }

    getValueCaption() {
      const x = this.state.x,
            y = this.state.y,
            units = localStorage.getItem('default-units') || 'mm';

      if (units === 'inches') {
        return `${Number(x / 25.4).toFixed(3)}\", ${Number(y / 25.4).toFixed(3)}\"`;
      } else {
        return `${x}, ${y} mm`;
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
      }, LANG.position, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        defaultValue: this.state.x,
        getValue: this._update_x_handler
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        defaultValue: this.state.y,
        getValue: this._update_y_handler
      })))));
    }

  }

  ;
  PositionPanel.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  };
  return PositionPanel;
});