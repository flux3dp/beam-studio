import React from 'react';

import classNames from 'classnames';

import SelectView from '@core/app/widgets/Select';
import type { OffsetMode } from '@core/helpers/clipper/offset';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  offsetMode: OffsetMode;
  onValueChange: (mode: OffsetMode) => void;
}

function OffsetDirectionPanel({ offsetMode: offsetMode, onValueChange }: Props): React.JSX.Element {
  const [mode, setMode] = React.useState(offsetMode);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const setOffsetMode = (mode: OffsetMode) => {
    onValueChange(mode);
    setMode(mode);
  };

  const getOffsetModeString = () =>
    ({
      inwardFilled: 'Inward Filled',
      inwardOutline: LANG._offset.inward,
      outwardFilled: 'Outward Filled',
      outwardOutline: LANG._offset.outward,
    })[mode];

  const options = [
    {
      label: LANG._offset.outward,
      selected: mode === 'outwardOutline',
      value: 'outwardOutline',
    },
    {
      label: LANG._offset.inward,
      selected: mode === 'inwardOutline',
      value: 'inwardOutline',
    },
    {
      label: 'Outward Filled',
      selected: mode === 'outwardFilled',
      value: 'outwardFilled',
    },
    {
      label: 'Inward Filled',
      selected: mode === 'inwardFilled',
      value: 'inwardFilled',
    },
  ];

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.direction}
          <span className="value">{getOffsetModeString()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control offset-dir">
            <SelectView
              id="select-offset-dir"
              onChange={(e) => {
                setOffsetMode(e.target.value as OffsetMode);
              }}
              options={options}
            />
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetDirectionPanel;
