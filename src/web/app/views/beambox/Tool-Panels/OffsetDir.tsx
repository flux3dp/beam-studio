import SelectView from '../../../widgets/Select';
import * as i18n from '../../../../helpers/i18n';
const React = requireNode('react');
const LANG = i18n.lang.beambox.tool_panels;
class OffsetDirPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dir: this.props.dir
        };
    }

    _updateOffsetDir(val) {
        this.props.onValueChange(val);
        this.setState({ dir: val });
    }

    _getOffsetDir() {
        const typeNameMap = {
            0: LANG._offset.inward,
            1: LANG._offset.outward
        }
        return typeNameMap[this.state.dir];
    }

    render() {
        const options = [
            {
                value: 1,
                label: LANG._offset.outward,
                selected: this.state.dir === 1
            },
            {
                value: 0,
                label: LANG._offset.inward,
                selected: this.state.dir === 0
            }
        ];
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG._offset.direction}
                        <span className="value">{this._getOffsetDir()}</span>
                    </p>
                    <label className="accordion-body">
                        <div className="control offset-dir">
                        <SelectView
                            id='select-offset-dir'
                            options={options}
                            onChange={e => {this._updateOffsetDir(parseInt(e.target.value))}}
                        />
                        </div>
                    </label>
                </label>
            </div>
        );
    }
}

export default OffsetDirPanel;
