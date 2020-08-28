define(['app/actions/beambox/font-funcs'], function (FontFuncs) {
  const React = require('react');

  const FontFamily = ({
    currentFontFamily,
    fontFamilyOptions,
    onChange
  }) => {
    const options = fontFamilyOptions.map(option => /*#__PURE__*/React.createElement("option", {
      value: option,
      key: option
    }, FontFuncs.fontNameMap.get(option)));
    return /*#__PURE__*/React.createElement("select", {
      value: currentFontFamily,
      onChange: e => {
        onChange(e.target.value);
      },
      onKeyDown: e => e.stopPropagation(),
      style: {
        lineHeight: '1.5em'
      }
    }, options);
  };

  return FontFamily;
});