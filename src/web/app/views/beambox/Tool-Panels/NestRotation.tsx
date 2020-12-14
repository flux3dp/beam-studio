import UnitInput from'../../../widgets/Unit-Input-v2';
import * as i18n from '../../../../helpers/i18n';
const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;

class NestRotationPanel extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            rotations: props.rotations,
        };
    }

    _updateVal(val) {
        this.props.onValueChange(val);
        this.setState({ rotations: val });
    }

    _getValueCaption() {
        const rotations = this.state.rotations;
        return `${rotations}`
    }

    render() {

        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG._nest.rotations}
                        <span className="value">{this._getValueCaption()}</span>
                    </p>
                    <label className='accordion-body'>
                        <div>
                            <div className='control nest-rotations'>
                                <UnitInput
                                    min={1}
                                    decimal={0}
                                    unit=''
                                    defaultValue={this.state.rotations}
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

export default NestRotationPanel;
