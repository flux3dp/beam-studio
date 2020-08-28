define([
    'app/actions/beambox/font-funcs',
], function(
    FontFuncs
) {
    const React = require('react');

    const FontFamily = ({currentFontFamily, fontFamilyOptions, onChange}) => {
        const options = fontFamilyOptions.map(
            option => (
                <option value={option} key={option}>
                    {FontFuncs.fontNameMap.get(option)}
                </option>
            )
        );
        return (
            <select
                value={currentFontFamily}
                onChange={e => {
                    onChange(e.target.value);
                }}
                onKeyDown={e => e.stopPropagation()}
                style={{
                    lineHeight: '1.5em'
                }}
            >
                {options}
            </select>
        );
    };

    return FontFamily;
});
