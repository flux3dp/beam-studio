define([], function () {
  'use strict';

  const React = require('react');

  return class RadioGroup extends React.Component {
    render() {
      var options = this.props.options.map(function (opt, i) {
        var checked = false;

        if (opt.checked === true || opt.checked === 'checked') {
          checked = true;
        }

        return /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
          type: "radio",
          defaultChecked: checked,
          name: this.props.name,
          value: opt.value
        }), opt.label);
      }, this);
      return /*#__PURE__*/React.createElement("div", {
        id: this.props.id,
        className: this.props.className
      }, options);
    }

  };
});