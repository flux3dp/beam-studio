define(['reactPropTypes', 'plugins/classnames/index'], function (PropTypes, ClassNames) {
  'use strict';

  const React = require('react');

  class RadioControl extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        selected: this.props.default,
        default: this.props.options[0].id
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      let _new = nextProps.default,
          _old = this.state.selected;

      if (_new !== _old) {
        this.setState({
          selected: nextProps.default
        });
      }
    }

    _handleChange(newValue, disable) {
      if (disable !== true) {
        this.setState({
          selected: newValue
        });
        this.props.onChange(this.props.id, newValue);
      }
    }

    render() {
      var _options = this.props.options.map(function (option) {
        var radioClass = ClassNames({
          'selected': this.state.selected === option.id
        });
        return /*#__PURE__*/React.createElement("div", {
          key: option.id,
          className: `radio ${option.id}`,
          onClick: this._handleChange.bind(null, option.id, option.disable)
        }, /*#__PURE__*/React.createElement("div", {
          className: radioClass
        }), /*#__PURE__*/React.createElement("span", null, option.name));
      }.bind(this));

      return /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "label"
      }, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, _options));
    }

  }

  ;
  RadioControl.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    default: PropTypes.string,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
  };
  return RadioControl;
});