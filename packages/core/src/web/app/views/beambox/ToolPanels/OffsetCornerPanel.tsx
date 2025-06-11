import React from 'react';

import classNames from 'classnames';

import SelectView from '@core/app/widgets/Select';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  cornerType: 'round' | 'sharp';
  onValueChange: (val: 'round' | 'sharp') => void;
}

function OffsetCornerPanel({ cornerType: cornerTypeProps, onValueChange }: Props): React.JSX.Element {
  const [cornerType, updateCornerType] = React.useState(cornerTypeProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateOffsetCorner = (cornerType: 'round' | 'sharp') => {
    onValueChange(cornerType);
    updateCornerType(cornerType);
  };

  const getOffsetCornerText = () => ({ round: LANG._offset.round, sharp: LANG._offset.sharp })[cornerType];

  const options = [
    { label: LANG._offset.sharp, selected: cornerType === 'sharp', value: 'sharp' },
    { label: LANG._offset.round, selected: cornerType === 'round', value: 'round' },
  ];

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.corner_type}
          <span className="value">{getOffsetCornerText()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control offset-corner">
            <SelectView
              id="select-offset-corner"
              onChange={(e) => updateOffsetCorner(e.target.value)}
              options={options}
            />
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetCornerPanel;
