function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes'], function (PropTypes) {
  'use strict';

  const React = require('react');

  const classNames = require('classnames');

  class SwitchControl extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_fireChange", newValue => {
        this.props.onChange(this.props.id, newValue);
      });

      _defineProperty(this, "_handleToggle", e => {
        const {
          isDisabled
        } = this.props;

        if (isDisabled) {
          return;
        }

        var isChecked = e.target.checked;
        this.setState({
          checked: isChecked
        }, function () {
          this._fireChange(isChecked);
        });
      });

      this.state = {
        checked: this.props.default
      };
    }

    shouldComponentUpdate(nextProps, nextState) {
      var newPropIsDifferent = nextProps.default !== this.state.checked || nextProps.isDisabled !== this.props.isDisabled,
          newStateIsDifferent = this.state.checked !== nextState.checked;
      return newPropIsDifferent || newStateIsDifferent;
    }

    render() {
      const {
        isDisabled
      } = this.props;
      const containerClass = classNames('controls', {
        disabled: isDisabled
      });
      return /*#__PURE__*/React.createElement("div", {
        className: containerClass,
        name: this.props.id
      }, /*#__PURE__*/React.createElement("div", {
        className: "label pull-left"
      }, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("div", {
        className: "switch-container"
      }, /*#__PURE__*/React.createElement("div", {
        className: "switch-status"
      }, this.state.checked ? this.props.onText : this.props.offText), /*#__PURE__*/React.createElement("div", {
        className: "onoffswitch",
        name: this.props.name || ''
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        name: "onoffswitch",
        className: "onoffswitch-checkbox",
        id: this.props.id,
        onChange: this._handleToggle,
        checked: isDisabled ? this.props.default : this.state.checked
      }), /*#__PURE__*/React.createElement("label", {
        className: "onoffswitch-label",
        htmlFor: this.props.id
      }, /*#__PURE__*/React.createElement("span", {
        className: "onoffswitch-inner"
      }), /*#__PURE__*/React.createElement("span", {
        className: "onoffswitch-switch"
      }))))));
    }

  }

  ;
  SwitchControl.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    onText: PropTypes.string,
    offText: PropTypes.string,
    default: PropTypes.bool,
    onChange: PropTypes.func.isRequired
  };
  SwitchControl.defaultProps = {
    onText: 'ON',
    offText: 'OFF'
  };
  return SwitchControl;
});