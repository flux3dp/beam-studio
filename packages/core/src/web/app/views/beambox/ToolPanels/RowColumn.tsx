import React from 'react';

import classNames from 'classnames';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

let lang = i18n.lang.beambox.tool_panels;

interface Props {
  column?: number;
  onValueChange?: (rc: { column: number; row: number }) => void;
  row?: number;
}

interface State {
  column: number;
  isCollapsed: boolean;
  row: number;
}

// TODO: refactor to functional component
class RowColumn extends React.Component<Props, State> {
  constructor(props: Props) {
    lang = i18n.lang.beambox.tool_panels;
    super(props);

    const { column, row } = this.props;

    this.state = {
      column,
      isCollapsed: false,
      row,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      column: nextProps.column,
      row: nextProps.row,
    });
  }

  onRawChanged = (row: number) => {
    const { onValueChange } = this.props;
    const { column } = this.state;

    onValueChange({
      column,
      row,
    });
    this.setState({ row });
  };

  onColumnChanged = (column: number) => {
    const { onValueChange } = this.props;
    const { row } = this.state;

    onValueChange({
      column,
      row,
    });
    this.setState({ column });
  };

  render(): React.JSX.Element {
    const { column, isCollapsed, row } = this.state;

    return (
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
            {lang.array_dimension}
            <span className="value">{`${row} X ${column}`}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
            <div className="control">
              <div className="text-center header">{lang.columns}</div>
              <UnitInput
                decimal={0}
                defaultValue={column || 1}
                getValue={this.onColumnChanged}
                id="columns"
                min={1}
                unit=""
              />
            </div>
            <div className="control">
              <div className="text-center header">{lang.rows}</div>
              <UnitInput decimal={0} defaultValue={row || 1} getValue={this.onRawChanged} id="rows" min={1} unit="" />
            </div>
          </div>
        </label>
      </div>
    );
  }
}

export default RowColumn;
