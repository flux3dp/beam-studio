define([
], function(
) {
    const React = require('react');
    return ({isChecked, onChange}) => {
        return (
            <label className='shading-checkbox' onClick={() => onChange(!isChecked)}>
                <i className={isChecked ? 'fa fa-toggle-on' : 'fa fa-toggle-off'} />
            </label>
        );
    };
});
