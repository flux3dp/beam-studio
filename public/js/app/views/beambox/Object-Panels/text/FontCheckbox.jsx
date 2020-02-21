define([
    'react',
], function(
    React
) {
    return ({isChecked, onChange}) => {
        return (
            <label className='shading-checkbox' onClick={() => onChange(!isChecked)}>
                <i className={isChecked ? 'fa fa-toggle-on' : 'fa fa-toggle-off'} />
            </label>
        );
    };
});
