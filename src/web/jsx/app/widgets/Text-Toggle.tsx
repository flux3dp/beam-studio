function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  'use strict';

  var _class, _temp;

  const React = require('react');

  return _temp = _class = class TextToggle extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_onClick", e => {
        this.state.checked = !this.state.checked;
        this.setState({
          checked: this.state.checked
        });
        this.props.onClick(e);
      });

      _defineProperty(this, "isChecked", () => {
        return this.state.checked;
      });

      this.state = {
        checked: this.props.defaultChecked
      };
    } // UI events


    // Lifecycle
    render() {
      var props = this.props,
          lang = props.lang,
          stateStyle = true === this.state.checked ? 'on' : 'off',
          defaultClassName = 'ui ui-control-text-toggle',
          className = defaultClassName + ('string' === typeof this.props.className ? ' ' + this.props.className : '');
      return /*#__PURE__*/React.createElement("label", {
        className: className,
        title: props.title
      }, /*#__PURE__*/React.createElement("span", {
        className: "caption"
      }, props.displayText), /*#__PURE__*/React.createElement("input", {
        refs: "toggle",
        type: "checkbox",
        className: stateStyle,
        defaultValue: props.defaultValue,
        checked: this.state.checked,
        onClick: this._onClick
      }), /*#__PURE__*/React.createElement("span", {
        className: "status",
        "data-text-on": props.textOn,
        "data-text-off": props.textOff
      }));
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        checked: nextProps.defaultChecked
      });
    }

  }, _defineProperty(_class, "defaultProps", {
    title: '',
    textOn: '',
    textOff: '',
    defaultChecked: false,
    defaultValue: '',
    displayText: '',
    className: '',
    // events
    onClick: function () {}
  }), _temp;
});