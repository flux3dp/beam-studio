import SelectView from '../../../widgets/Select';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;
class OffsetCornerPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            cornerType: this.props.cornerType
        };
    }

    _updateOffsetCorner(val) {
        this.props.onValueChange(val);
        this.setState({ cornerType: val });
    }

    _getOffsetCorner() {
        const typeNameMap = {
            'sharp': LANG._offset.sharp,
            'round': LANG._offset.round
        }
        return typeNameMap[this.state.cornerType];
    }

    render() {
        const options = [
            {
                value: 'sharp',
                label: LANG._offset.sharp,
                selected: this.state.cornerType === 'sharp'
            },
            {
                value: 'round',
                label: LANG._offset.round,
                selected: this.state.cornerType === 'round'
            }
        ];
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG._offset.corner_type}
                        <span className="value">{this._getOffsetCorner()}</span>
                    </p>
                    <label className="accordion-body">
                        <div className="control offset-corner">
                        <SelectView
                            id='select-offset-corner'
                            options={options}
                            onChange={e => {this._updateOffsetCorner(e.target.value)}}
                        />
                        </div>
                    </label>
                </label>
            </div>
        );
    }
}

export default OffsetCornerPanel;
