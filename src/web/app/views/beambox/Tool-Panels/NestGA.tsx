import UnitInput from'../../../widgets/Unit-Input-v2';
import * as i18n from '../../../../helpers/i18n';
const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;

class NestGAPanel extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            generations: props.nestOptions.generations,
            population: props.nestOptions.population
        };
    }

    _updateGen = (val) => {
        this.props.updateNestOptions({ generations: val });
        this.setState({generations: val});
    }

    _updatePopu = (val) => {
        this.props.updateNestOptions({ population: val });
        this.setState({population: val});
    }

    _getValueCaption() {
        const {generations, population} = this.state;
        console.log(this.state);
        return `G${generations}, P${population}`
    }

    render() {

        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {'GA'}
                        <span className="value">{this._getValueCaption()}</span>
                    </p>
                    <label className='accordion-body'>
                        <div>
                            <span className="text-center header">Generations</span>
                            <div className='control'>
                                <UnitInput
                                    min={1}
                                    unit=''
                                    decimal={0}
                                    defaultValue={this.state.generations}
                                    getValue={(val) => {this._updateGen(val)}}
                                />
                            </div>
                            <span className="text-center header">Population</span>
                            <div className='control'>
                                <UnitInput
                                    min={2}
                                    unit=''
                                    decimal={0}
                                    defaultValue={this.state.population}
                                    getValue={(val) => {this._updatePopu(val)}}
                                />
                            </div>
                        </div>
                    </label>
                </label>
            </div>
        );
    }
};

export default NestGAPanel;
