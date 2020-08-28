function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'plugins/classnames/index'], function (PropTypes, ClassNames) {
  'use strict';

  const React = require('react');

  class DropDownControl extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_fireChange", (newValue, selectedIndex) => {
        if (this.props.id) {
          this.props.onChange(this.props.id, newValue, selectedIndex);
        } else {
          this.props.onChange(newValue, selectedIndex);
        }
      });

      _defineProperty(this, "_handleChange", e => {
        let {
          value,
          selectedIndex
        } = e.target;
        this.setState({
          selectedValue: value
        }, function () {
          this._fireChange(value, selectedIndex);
        });
      });

      this.state = {
        selectedValue: this.props.default
      };
    }

    shouldComponentUpdate(nextProps, nextState) {
      var newPropIsDifferent = nextProps.default !== this.state.sliderValue,
          newStateIsDifferent = this.state.selectedValue !== nextState.selectedValue;
      return newPropIsDifferent || newStateIsDifferent;
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.options.length !== this.props.options.length) {
        this.forceUpdate();
      }
    }

    render() {
      var self = this,
          _options;

      _options = this.props.options.map(function (option) {
        if (typeof option === 'object') {
          return /*#__PURE__*/React.createElement("option", {
            key: option.value,
            value: option.value
          }, option.label);
        } else {
          return /*#__PURE__*/React.createElement("option", {
            key: option,
            value: option
          }, option);
        }
      });
      const firstChildSelected = this.props.options ? this.state.selectedValue === this.props.options[0].value : false;
      const classNames = firstChildSelected ? 'dropdown-container first-child-selected' : 'dropdown-container';
      return /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "label pull-left"
      }, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("div", {
        className: classNames
      }, /*#__PURE__*/React.createElement("select", {
        id: this.props.id,
        onChange: this._handleChange,
        defaultValue: self.props.default
      }, _options))));
    }

  }

  ;
  DropDownControl.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    options: PropTypes.array,
    default: PropTypes.string,
    onChange: PropTypes.func.isRequired
  };
  return DropDownControl;
});