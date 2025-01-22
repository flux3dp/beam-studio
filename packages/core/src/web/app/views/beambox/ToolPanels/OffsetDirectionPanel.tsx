import React from 'react';

import classNames from 'classnames';

import SelectView from '@core/app/widgets/Select';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  dir: number;
  onValueChange: (val: number) => void;
}

function OffsetDirectionPanel({ dir: dirProps, onValueChange }: Props): React.JSX.Element {
  const [dir, updateDir] = React.useState(dirProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateOffsetDir = (val: number) => {
    onValueChange(val);
    updateDir(val);
  };

  const getOffsetDir = () =>
    ({
      0: LANG._offset.inward,
      1: LANG._offset.outward,
    })[dir];

  const options = [
    {
      label: LANG._offset.outward,
      selected: dir === 1,
      value: 1,
    },
    {
      label: LANG._offset.inward,
      selected: dir === 0,
      value: 0,
    },
  ];

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.direction}
          <span className="value">{getOffsetDir()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control offset-dir">
            <SelectView
              id="select-offset-dir"
              onChange={(e) => {
                updateOffsetDir(Number.parseInt(e.target.value, 10));
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
