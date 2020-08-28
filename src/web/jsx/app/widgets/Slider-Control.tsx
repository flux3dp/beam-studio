function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'plugins/classnames/index'], function (PropTypes, ClassNames) {
  'use strict';

  const React = require('react');

  class SliderControl extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_fireChange", newValue => {
        this.props.onChange(this.props.id, newValue);
      });

      _defineProperty(this, "_validateValue", e => {
        if (!this._isValidValue(this.state.sliderValue)) {
          this.setState({
            sliderValue: this.state.lastValidValue
          });

          this._fireChange(this.state.lastValidValue);
        }
      });

      _defineProperty(this, "_isValidValue", value => {
        var min = this.props.min,
            max = this.props.max;
        return min <= value && value <= max;
      });

      _defineProperty(this, "_handleSliderChange", (key, e) => {
        var value = e.target.value;
        this.setState({
          sliderValue: value,
          lastValidValue: value
        }, function () {
          this._fireChange(value);
        });
      });

      _defineProperty(this, "_handleEditValue", e => {
        var newValue = e.target.value;

        if (this._isValidValue(newValue)) {
          this.setState({
            lastValidValue: newValue
          });

          this._fireChange(newValue);
        }

        this.setState({
          sliderValue: newValue
        });
      });

      this.state = {
        sliderValue: this.props.default,
        lastValidValue: this.props.default
      };
    }

    shouldComponentUpdate(nextProps, nextState) {
      var newPropIsDifferent = nextProps.default !== this.state.sliderValue,
          newStateIsDifferent = this.state.sliderValue !== nextState.sliderValue;
      return newPropIsDifferent || newStateIsDifferent;
    }

    render() {
      let unitClass = "control pull-right unit-" + this.props.unit;
      return /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "label pull-left"
      }, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: unitClass
      }, /*#__PURE__*/React.createElement("div", {
        className: "slider-container"
      }, /*#__PURE__*/React.createElement("input", {
        className: "slider",
        type: "range",
        min: this.props.min,
        max: this.props.max,
        step: this.props.step,
        value: this.state.sliderValue,
        onChange: this._handleSliderChange.bind(null, this.props.id)
      })), /*#__PURE__*/React.createElement("input", {
        id: this.props.id,
        type: "text",
        value: this.state.sliderValue,
        onChange: this._handleEditValue,
        onFocus: this._handleEditValue,
        onBlur: this._validateValue
      })));
    }

  }

  ;
  SliderControl.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    step: PropTypes.number.isRequired,
    default: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    unit: PropTypes.string
  };
  return SliderControl;
});