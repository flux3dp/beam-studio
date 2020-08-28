function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n'], function ($, PropTypes, UnitInput, i18n) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class RowColumn extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_row_handler", val => {
        this.setState({
          row: val
        });
        let rc = this.state;
        rc.row = val;
        this.props.onValueChange(rc);
      });

      _defineProperty(this, "_update_column_handler", val => {
        this.setState({
          column: val
        });
        let rc = this.state;
        rc.column = val;
        this.props.onValueChange(rc);
      });

      _defineProperty(this, "getValueCaption", () => {
        const row = this.state.row,
              column = this.state.column;
        return `${row} X ${column}`;
      });

      this.state = {
        row: this.props.row,
        column: this.props.column,
        onValueChange: this.props.onValueChange
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        row: nextProps.row,
        column: nextProps.column,
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
      }, LANG.array_dimension, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.columns), /*#__PURE__*/React.createElement(UnitInput, {
        min: 1,
        unit: "",
        decimal: 0,
        defaultValue: this.state.column || 1,
        getValue: this._update_column_handler
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.rows), /*#__PURE__*/React.createElement(UnitInput, {
        min: 1,
        unit: "",
        decimal: 0,
        defaultValue: this.state.row || 1,
        getValue: this._update_row_handler
      })))));
    }

  }

  ;
  RowColumn.propTypes = {
    row: PropTypes.number.isRequired,
    column: PropTypes.number.isRequired,
    onValueChange: PropTypes.func,
    onColumnChange: PropTypes.func
  };
  return RowColumn;
});