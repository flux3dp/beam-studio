function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'plugins/classnames/index'], function (PropTypes, ClassNames) {
  'use strict';

  var _class, _temp;

  const React = require('react');

  return _temp = _class = class CheckboxControl extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleToggleChange", id => {
        let {
          selected
        } = this.state;

        if (selected.indexOf(id) === -1) {
          selected.push(id);
        } else {
          let i = selected.indexOf(id);
          selected = selected.slice(0, i).concat(selected.slice(i + 1));
        }

        this.props.onChange(this.props.id, selected, id);
      });

      let _selected = this.props.default;
      this.state = {
        selected: _selected
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      let _new = JSON.stringify(nextProps.default),
          _old = JSON.stringify(this.state.selected);

      if (_new !== _old) {
        this.setState({
          selected: nextProps.default
        });
      }
    }

    render() {
      var _options = this.props.options.map(function (option) {
        var checkboxClass = ClassNames({
          'selected': this.state.selected.indexOf(option.id) !== -1
        });
        return /*#__PURE__*/React.createElement("div", {
          className: "checkbox",
          onClick: this._handleToggleChange.bind(null, option.id)
        }, /*#__PURE__*/React.createElement("div", {
          className: checkboxClass
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

  }, _defineProperty(_class, "propTypes", {
    id: PropTypes.string,
    label: PropTypes.string,
    default: PropTypes.array,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
  }), _temp;
});