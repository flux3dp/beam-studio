import SelectView from '../../../widgets/Select';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.tool_panels;
class OffsetDirPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dir: this.props.dir,
            isCollapsed: false,
        };
    }

    updateOffsetDir(val) {
        this.props.onValueChange(val);
        this.setState({ dir: val });
    }

    getOffsetDir() {
        const typeNameMap = {
            0: LANG._offset.inward,
            1: LANG._offset.outward
        }
        return typeNameMap[this.state.dir];
    }

    render() {
        const { isCollapsed } = this.state;
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
                    <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
                        {LANG._offset.direction}
                        <span className="value">{this.getOffsetDir()}</span>
                    </p>
                    <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
                        <div className="control offset-dir">
                        <SelectView
                            id='select-offset-dir'
                            options={options}
                            onChange={e => {this.updateOffsetDir(parseInt(e.target.value))}}
                        />
                        </div>
                    </div>
                </label>
            </div>
        );
    }
}

export default OffsetDirPanel;
