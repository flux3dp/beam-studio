define([], function () {
  const React = require('react');

  return ({
    isChecked,
    onChange
  }) => {
    return /*#__PURE__*/React.createElement("label", {
      className: "shading-checkbox",
      onClick: () => onChange(!isChecked)
    }, /*#__PURE__*/React.createElement("i", {
      className: isChecked ? 'fa fa-toggle-on' : 'fa fa-toggle-off'
    }));
  };
});