import UnitInput from'app/widgets/Unit-Input-v2';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.tool_panels;

class OffsetDistPanel extends React.Component{

    constructor(props) {
        super(props);

        this.state = {
            distance: props.distance,
            isCollapsed: false,
        };
    }

    updateDist(val) {
        this.props.onValueChange(val);
        this.setState({ distance: val });
    }

    getValueCaption() {
        const dist = this.state.distance, 
            units = storage.get('default-units') || 'mm';
        if (units === 'inches') {
            return `${Number(dist/25.4).toFixed(3)}\"`;
        } else {
            return `${dist} mm`;
        }
    }

    render() {
        const { isCollapsed } = this.state;
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
                        {LANG._offset.dist}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
                        <div>
                            <div className='control offset-dist'>
                                <UnitInput
                                    min={0}
                                    unit='mm'
                                    defaultValue={this.state.distance}
                                    getValue={(val) => {this.updateDist(val)}}
                                />
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        );
    }
};

export default OffsetDistPanel;
