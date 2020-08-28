function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'app/actions/beambox/constant'], function ($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class Line extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_x1_handler", val => {
        FnWrapper.update_line_x1(val);
        this.setState({
          x1: val
        });
      });

      _defineProperty(this, "_update_y1_handler", val => {
        FnWrapper.update_line_y1(val);
        this.setState({
          y1: val
        });
      });

      _defineProperty(this, "_update_x2_handler", val => {
        FnWrapper.update_line_x2(val);
        this.setState({
          x2: val
        });
      });

      _defineProperty(this, "_update_y2_handler", val => {
        FnWrapper.update_line_y2(val);
        this.setState({
          y2: val
        });
      });

      _defineProperty(this, "getValueCaption", () => {
        const x1 = this.state.x1,
              y1 = this.state.y1,
              x2 = this.state.x2,
              y2 = this.state.y2,
              units = localStorage.getItem('default-units') || 'mm';

        if (units === 'inches') {
          return `A (${Number(x1 / 25.4).toFixed(1)}, ${Number(y1 / 25.4).toFixed(1)}), B (${Number(x2 / 25.4).toFixed(1)}, ${Number(y2 / 25.4).toFixed(1)})`;
        } else {
          return `A (${x1.toFixed(1)}, ${y1.toFixed(1)}), B (${x2.toFixed(1)}, ${y2.toFixed(1)})`;
        }
      });

      this.state = {
        x1: this.props.x1,
        y1: this.props.y1,
        x2: this.props.x2,
        y2: this.props.y2
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        x1: nextProps.x1,
        y1: nextProps.y1,
        x2: nextProps.x2,
        y2: nextProps.y2
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
      }, LANG.points, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "A"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        abbr: true,
        defaultValue: this.state.x1,
        getValue: this._update_x1_handler,
        className: {
          'input-halfsize': true
        }
      }), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        abbr: true,
        defaultValue: this.state.y1,
        getValue: this._update_y1_handler,
        className: {
          'input-halfsize': true
        }
      }))), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, "B"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        abbr: true,
        defaultValue: this.state.x2,
        getValue: this._update_x2_handler,
        className: {
          'input-halfsize': true
        }
      }), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        abbr: true,
        defaultValue: this.state.y2,
        getValue: this._update_y2_handler,
        className: {
          'input-halfsize': true
        }
      }))))));
    }

  }

  ;
  Line.propTypes = {
    x1: PropTypes.number.isRequired,
    y1: PropTypes.number.isRequired,
    x2: PropTypes.number.isRequired,
    y2: PropTypes.number.isRequired
  };
  return Line;
});