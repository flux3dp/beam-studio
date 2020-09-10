const PropTypes = require('reactPropTypes')
import UnitInput from'../../../widgets/Unit-Input-v2'
import LocalStorage from '../../../../helpers/local-storage'
import * as i18n from '../../../../helpers/i18n'
import Constant from '../../../actions/beambox/constant'

const React = requireNode('react');;
const LANG = i18n.lang.beambox.tool_panels;


class Interval extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            dx: this.props.dx,
            dy: this.props.dy,
            onValueChange: this.props.onValueChange,
        };
    }
    
    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            dx: nextProps.dx,
            dy: nextProps.dy,
            onValueChange: nextProps.onValueChange,
        });
    }

    _update_dx_handler = (val) => {
        this.setState({dx: val});
        let distance = this.state;
        distance.dx = val;
        this.props.onValueChange(distance);
    }

    _update_dy_handler = (val) => {
        this.setState({dy: val});
        let distance = this.state;
        distance.dy = val;
        this.props.onValueChange(distance);       
    }

    getValueCaption = () => {
        const dx = this.state.dx, 
            dy = this.state.dy,
            units = LocalStorage.get('default-units') || 'mm';
        if (units === 'inches') {
            return `${Number(dx/25.4).toFixed(3)}\", ${Number(dy/25.4).toFixed(3)}\"`;
        } else {
            return `${dx}, ${dy} mm`;
        }
    }

    render() {
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG.array_interval}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <label className="accordion-body">
                        <div className="control">
                            <span className="text-center header">{LANG.dx}</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.getWidth()/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.dx}
                                getValue={this._update_dx_handler}
                            />
                        </div>
                        <div className="control">
                            <span className="text-center header">{LANG.dy}</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.getHeight()/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.dy}
                                getValue={this._update_dy_handler}
                            />
                        </div>
                    </label>
                </label>
            </div>
        );
    }
};

Interval.propTypes = {
    dx: PropTypes.number.isRequired,
    dy: PropTypes.number.isRequired,
    onValueChange: PropTypes.func,
}

export default Interval;