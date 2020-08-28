define([
    'jsx!widgets/Unit-Input-v2',
], function(UnitInput) {
    const React = require('react');

    const FontSize = ({currentFontSize, onChange}) => {
        return (
            <UnitInput
                min={1}
                unit='px'
                decimal={0}
                defaultValue={currentFontSize}
                getValue={onChange}
            />
        );
    };

    return FontSize;
});
