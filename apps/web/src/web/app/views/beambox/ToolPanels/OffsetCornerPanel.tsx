import classNames from 'classnames';
import React from 'react';

import i18n from 'helpers/i18n';
import SelectView from 'app/widgets/Select';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  cornerType: string,
  onValueChange: (val: string) => void,
}

function OffsetCornerPanel({ cornerType: cornerTypeProps, onValueChange }: Props): JSX.Element {
  const [cornerType, updateCornerType] = React.useState(cornerTypeProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateOffsetCorner = (val: string) => {
    onValueChange(val);
    updateCornerType(val);
  };

  const getOffsetCornerText = () => ({
    sharp: LANG._offset.sharp,
    round: LANG._offset.round,
  }[cornerType]);

  const options = [
    {
      value: 'sharp',
      label: LANG._offset.sharp,
      selected: cornerType === 'sharp',
    },
    {
      value: 'round',
      label: LANG._offset.round,
      selected: cornerType === 'round',
    },
  ];
  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.corner_type}
          <span className="value">{getOffsetCornerText()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control offset-corner">
            <SelectView
              id="select-offset-corner"
              options={options}
              onChange={(e) => updateOffsetCorner(e.target.value)}
            />
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetCornerPanel;
