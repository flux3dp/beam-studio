import UnitInput from'app/widgets/Unit-Input-v2';
import Constant from 'app/actions/beambox/constant';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const classNames = requireNode('classnames');

const LANG = i18n.lang.beambox.tool_panels;

class Interval extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            dx: this.props.dx,
            dy: this.props.dy,
            onValueChange: this.props.onValueChange,
            isCollapsed: false,
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            dx: nextProps.dx,
            dy: nextProps.dy,
            onValueChange: nextProps.onValueChange,
        });
    }

    updateDxHandler = (val) => {
        this.setState({dx: val});
        let distance = this.state;
        distance.dx = val;
        this.props.onValueChange(distance);
    }

    updateDyHandler = (val) => {
        this.setState({dy: val});
        let distance = this.state;
        distance.dy = val;
        this.props.onValueChange(distance);
    }

    getValueCaption = () => {
        const dx = this.state.dx,
            dy = this.state.dy,
            units = storage.get('default-units') || 'mm';
        if (units === 'inches') {
            return `${Number(dx/25.4).toFixed(3)}\", ${Number(dy/25.4).toFixed(3)}\"`;
        } else {
            return `${dx}, ${dy} mm`;
        }
    }

    render() {
        const { isCollapsed } = this.state;
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
                        {LANG.array_interval}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
                        <div className="control">
                            <span className="text-center header">{LANG.dx}</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.getWidth(BeamboxPreference.read('model'))/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.dx}
                                getValue={this.updateDxHandler}
                            />
                        </div>
                        <div className="control">
                            <span className="text-center header">{LANG.dy}</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.getHeight(BeamboxPreference.read('model'))/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.dy}
                                getValue={this.updateDyHandler}
                            />
                        </div>
                    </div>
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
