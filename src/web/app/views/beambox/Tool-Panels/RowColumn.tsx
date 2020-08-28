define([
    'jquery',
    'reactPropTypes',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
], function($, PropTypes, UnitInput, i18n) {
    'use strict';
    const React = require('react');

    const LANG = i18n.lang.beambox.tool_panels;
    
    class RowColumn extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                row: this.props.row,
                column: this.props.column,
                onValueChange: this.props.onValueChange,
            };
        }
        
        UNSAFE_componentWillReceiveProps(nextProps) {
            this.setState({
                row: nextProps.row,
                column: nextProps.column,
                onValueChange: nextProps.onValueChange,
            });
        }

        _update_row_handler = (val) => {
            this.setState({row: val});
            let rc = this.state;
            rc.row = val;
            this.props.onValueChange(rc);
        }

        _update_column_handler = (val) => {
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
            return (
                <div className="tool-panel">
                    <label className="controls accordion">
                        <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                        <p className="caption">
                            {LANG.array_dimension}
                            <span className="value">{this.getValueCaption()}</span>
                        </p>
                        <label className="accordion-body">
                            <div className="control">
                                <span className="text-center header">{LANG.columns}</span>
                                <UnitInput
                                    min={1}
                                    unit=""
                                    decimal={0}
                                    defaultValue={this.state.column || 1}
                                    getValue={this._update_column_handler}
                                />
                            </div>
                            <div className="control">
                                <span className="text-center header">{LANG.rows}</span>
                                <UnitInput
                                    min={1}
                                    unit=""
                                    decimal={0}
                                    defaultValue={this.state.row || 1}
                                    getValue={this._update_row_handler}
                                />
                            </div>
                        </label>
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

    return RowColumn;
});
