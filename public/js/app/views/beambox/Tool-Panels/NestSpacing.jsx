define([
    'jquery',
    'jsx!widgets/Unit-Input-v2',
    'helpers/local-storage',
    'helpers/i18n',
], function(
    $,
    UnitInput,
    LocalStorage,
    i18n
)   {
    const React = require('react');
    const LANG = i18n.lang.beambox.tool_panels;

    class NestSpacingPanel extends React.Component{

        constructor(props) {
            super(props);

            this.state = {
                spacing: props.spacing,
            };
        }

        _updateVal(val) {
            this.props.onValueChange(val);
            this.setState({ spacing: val });
        }

        _getValueCaption() {
            const spacing = this.state.spacing, 
                units = LocalStorage.get('default-units') | 'mm';
            if (units === 'inches') {
                return `${Number(spacing/25.4).toFixed(3)}\"`;
            } else {
                return `${spacing} mm`;
            }
        }

        render() {

            return (
                <div className="tool-panel">
                    <label className="controls accordion">
                        <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                        <p className="caption">
                            {LANG._nest.spacing}
                            <span className="value">{this._getValueCaption()}</span>
                        </p>
                        <label className='accordion-body'>
                            <div>
                                <div className='control nest-spacing'>
                                    <UnitInput
                                        min={0}
                                        unit='mm'
                                        defaultValue={this.state.spacing}
                                        getValue={(val) => {this._updateVal(val)}}
                                    />
                                </div>
                            </div>
                        </label>
                    </label>
                </div>
            );
        }
    };

    return NestSpacingPanel;
});
