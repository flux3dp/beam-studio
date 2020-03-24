define([
    'jsx!widgets/Unit-Input-v2',
], function(UnitInput) {
    const React = require('react');

    class LineSpacingPanel extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return (
                <UnitInput
                    unit=''
                    min={0.8}
                    step={0.1}
                    decimal={1}
                    defaultValue={this.props.lineSpacing}
                    getValue={this.props.onChange}
                />
            );
        }
    }
    

    return LineSpacingPanel;
});
