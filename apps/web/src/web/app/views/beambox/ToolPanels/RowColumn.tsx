import classNames from 'classnames';
import React from 'react';

import i18n from 'helpers/i18n';
import UnitInput from 'app/widgets/Unit-Input-v2';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  row?: number,
  column?: number,
  onValueChange?: (rc: { row: number, column: number }) => void,
}

interface State {
  row: number,
  column: number,
  isCollapsed: boolean,
}

class RowColumn extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { row, column } = this.props;
    this.state = {
      row,
      column,
      isCollapsed: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      row: nextProps.row,
      column: nextProps.column,
    });
  }

  onRawChanged = (row: number) => {
    const { onValueChange } = this.props;
    const { column } = this.state;
    onValueChange({
      row,
      column,
    });
    this.setState({ row });
  };

  onColumnChanged = (column: number) => {
    const { onValueChange } = this.props;
    const { row } = this.state;
    onValueChange({
      row,
      column,
    });
    this.setState({ column });
  };

  render(): JSX.Element {
    const { row, column, isCollapsed } = this.state;
    return (
      <div className="tool-panel">
        <label className="controls accordion">
          <input type="checkbox" className="accordion-switcher" defaultChecked />
          <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
            {LANG.array_dimension}
            <span className="value">{`${row} X ${column}`}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
            <div className="control">
              <div className="text-center header">{LANG.columns}</div>
              <UnitInput
                id="columns"
                min={1}
                unit=""
                decimal={0}
                defaultValue={column || 1}
                getValue={this.onColumnChanged}
              />
            </div>
            <div className="control">
              <div className="text-center header">{LANG.rows}</div>
              <UnitInput
                id="rows"
                min={1}
                unit=""
                decimal={0}
                defaultValue={row || 1}
                getValue={this.onRawChanged}
              />
            </div>
          </div>
        </label>
      </div>
    );
  }
}

export default RowColumn;
