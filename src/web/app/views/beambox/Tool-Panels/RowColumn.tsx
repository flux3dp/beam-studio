import $ from 'jquery';
import UnitInput from'../../../widgets/Unit-Input-v2';
import * as i18n from '../../../../helpers/i18n';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const classNames = requireNode('classnames');

const LANG = i18n.lang.beambox.tool_panels;

class RowColumn extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            row: this.props.row,
            column: this.props.column,
            onValueChange: this.props.onValueChange,
            isCollapsed: false,
        };
    }
    
    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            row: nextProps.row,
            column: nextProps.column,
            onValueChange: nextProps.onValueChange,
        });
    }

    update_row_handler = (val) => {
        this.setState({row: val});
        let rc = this.state;
        rc.row = val;
        this.props.onValueChange(rc);
    }

    update_column_handler = (val) => {
        this.setState({column: val});
        let rc = this.state;
        rc.column = val;
        this.props.onValueChange(rc);
    }

    getValueCaption = () => {
        const row = this.state.row, 
            column = this.state.column;
        return `${row} X ${column}`;
    }

    render() {
        const { isCollapsed } = this.state;
        return (
            <div className="tool-panel">
                <label className="controls accordion">
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
                        {LANG.array_dimension}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
                        <div className="control">
                            <div className="text-center header">{LANG.columns}</div>
                            <UnitInput
                                min={1}
                                unit=""
                                decimal={0}
                                defaultValue={this.state.column || 1}
                                getValue={this.update_column_handler}
                            />
                        </div>
                        <div className="control">
                            <div className="text-center header">{LANG.rows}</div>
                            <UnitInput
                                min={1}
                                unit=""
                                decimal={0}
                                defaultValue={this.state.row || 1}
                                getValue={this.update_row_handler}
                            />
                        </div>
                    </div>
                </label>
            </div>
        );
    } 
};

RowColumn.propTypes = {
    row: PropTypes.number.isRequired,
    column: PropTypes.number.isRequired,
    onValueChange: PropTypes.func,
    onColumnChange: PropTypes.func,
};

export default RowColumn;
