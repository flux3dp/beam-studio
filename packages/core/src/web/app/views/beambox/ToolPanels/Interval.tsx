import React from 'react';

import classNames from 'classnames';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

import storage from '@app/implementations/storage';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  dx?: number;
  dy?: number;
  onValueChange?: (rc: { dx: number; dy: number }) => void;
}

interface State {
  dx: number;
  dy: number;
  isCollapsed: boolean;
}

class Interval extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { dx, dy } = this.props;

    this.state = {
      dx,
      dy,
      isCollapsed: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props): void {
    this.setState({
      dx: nextProps.dx,
      dy: nextProps.dy,
    });
  }

  onDxChanged = (dx: number): void => {
    const { onValueChange } = this.props;
    const { dy } = this.state;

    onValueChange({
      dx,
      dy,
    });
    this.setState({ dx });
  };

  onDyChanged = (dy: number): void => {
    const { onValueChange } = this.props;
    const { dx } = this.state;

    onValueChange({
      dx,
      dy,
    });
    this.setState({ dy });
  };

  getValueCaption = (): string => {
    const { dx, dy } = this.state;
    const units = storage.get('default-units') || 'mm';

    return units === 'inches'
      ? `${Number(dx / 25.4).toFixed(3)}", ${Number(dy / 25.4).toFixed(3)}"`
      : `${dx}, ${dy} mm`;
  };

  render(): React.JSX.Element {
    const { dx, dy, isCollapsed } = this.state;
    const workarea = getWorkarea(BeamboxPreference.read('workarea'));

    return (
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption" onClick={() => this.setState({ isCollapsed: !isCollapsed })}>
            {LANG.array_interval}
            <span className="value">{this.getValueCaption()}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
            <div className="control">
              <span className="text-center header">{LANG.dx}</span>
              <UnitInput
                defaultValue={dx}
                getValue={this.onDxChanged}
                id="array_width"
                max={workarea.width}
                min={0}
                unit="mm"
              />
            </div>
            <div className="control">
              <span className="text-center header">{LANG.dy}</span>
              <UnitInput
                defaultValue={dy}
                getValue={this.onDyChanged}
                id="array_height"
                max={workarea.displayHeight || workarea.height}
                min={0}
                unit="mm"
              />
            </div>
          </div>
        </label>
      </div>
    );
  }
}

export default Interval;
