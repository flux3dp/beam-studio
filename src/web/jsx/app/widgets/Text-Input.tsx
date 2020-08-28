function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes'], function (PropTypes) {
  'use strict';

  var _class, _temp;

  const React = require('react');

  const ReactDOM = require('react-dom');

  return _temp = _class = class TextInput extends React.Component {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "value", () => {
        return ReactDOM.findDOMNode(this.refs.textInput).value;
      });
    }

    // Lifecycle
    render() {
      return /*#__PURE__*/React.createElement("input", {
        ref: "textInput",
        className: "ui ui-control-text-input",
        type: "text",
        defaultValue: this.props.displayValue
      });
    }

  }, _defineProperty(_class, "propTypes", {
    defaultValue: PropTypes.string
  }), _temp;
});