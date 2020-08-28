define(['jsx!widgets/Unit-Input-v2'], function (UnitInput) {
  const React = require('react');

  const LetterSpacing = ({
    currentLetterSpacing,
    onChange
  }) => {
    return /*#__PURE__*/React.createElement(UnitInput, {
      unit: "em",
      step: 0.05,
      defaultValue: currentLetterSpacing,
      getValue: onChange
    });
  };

  return LetterSpacing;
});