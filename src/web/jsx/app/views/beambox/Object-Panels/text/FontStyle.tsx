define(['plugins/classnames/index'], function (ClassNames) {
  const React = require('react');

  const FontStyle = ({
    currentFontStyle,
    fontStyleOptions,
    onChange
  }) => {
    const options = fontStyleOptions.map(option => /*#__PURE__*/React.createElement("option", {
      key: option,
      value: option
    }, option));
    const onlyOneOption = options.length === 1;
    return /*#__PURE__*/React.createElement("select", {
      value: currentFontStyle,
      onChange: e => onChange(e.target.value),
      onKeyDown: e => e.stopPropagation(),
      className: ClassNames({
        'no-triangle': onlyOneOption
      }),
      disabled: onlyOneOption,
      style: {
        lineHeight: '1.5em'
      }
    }, options);
  };

  return FontStyle;
});