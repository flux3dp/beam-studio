import UnitInput from'../../../widgets/Unit-Input-v2';
import LocalStorage from '../../../../helpers/local-storage';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;

class OffsetDistPanel extends React.Component{

    constructor(props) {
        super(props);

        this.state = {
            distance: props.distance,
        };
    }

    _updateDist(val) {
        this.props.onValueChange(val);
        this.setState({ distance: val });
    }

    _getValueCaption() {
        const dist = this.state.distance, 
            units = LocalStorage.get('default-units') || 'mm';
        if (units === 'inches') {
            return `${Number(dist/25.4).toFixed(3)}\"`;
        } else {
            return `${dist} mm`;
        }
    }

    render() {

        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG._offset.dist}
                        <span className="value">{this._getValueCaption()}</span>
                    </p>
                    <label className='accordion-body'>
                        <div>
                            <div className='control offset-dist'>
                                <UnitInput
                                    min={0}
                                    unit='mm'
                                    defaultValue={this.state.distance}
                                    getValue={(val) => {this._updateDist(val)}}
                                />
                            </div>
                        </div>
                    </label>
                </label>
            </div>
        );
    }
};

export default OffsetDistPanel;
