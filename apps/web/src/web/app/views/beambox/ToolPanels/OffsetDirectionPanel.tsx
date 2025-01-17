import classNames from 'classnames';
import React from 'react';

import i18n from 'helpers/i18n';
import SelectView from 'app/widgets/Select';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  dir: number,
  onValueChange: (val: number) => void,
}

function OffsetDirectionPanel({ dir: dirProps, onValueChange }: Props): JSX.Element {
  const [dir, updateDir] = React.useState(dirProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateOffsetDir = (val: number) => {
    onValueChange(val);
    updateDir(val);
  };

  const getOffsetDir = () => ({
    0: LANG._offset.inward,
    1: LANG._offset.outward,
  }[dir]);

  const options = [
    {
      value: 1,
      label: LANG._offset.outward,
      selected: dir === 1,
    },
    {
      value: 0,
      label: LANG._offset.inward,
      selected: dir === 0,
    },
  ];

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.direction}
          <span className="value">{getOffsetDir()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control offset-dir">
            <SelectView
              id="select-offset-dir"
              options={options}
              onChange={(e) => { updateOffsetDir(parseInt(e.target.value, 10)); }}
            />
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetDirectionPanel;
