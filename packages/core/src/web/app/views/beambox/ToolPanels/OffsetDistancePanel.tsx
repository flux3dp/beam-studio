import React from 'react';

import classNames from 'classnames';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

import storage from '@app/implementations/storage';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  distance: number;
  onValueChange: (val: number) => void;
}

function OffsetDistancePanel({ distance: distanceProps, onValueChange }: Props): React.JSX.Element {
  const [distance, updateDistance] = React.useState(distanceProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateDist = (val: number) => {
    onValueChange(val);
    updateDistance(val);
  };

  const getValueCaption = () => {
    const units = storage.get('default-units') || 'mm';

    return units === 'inches' ? `${Number(distance / 25.4).toFixed(3)}"` : `${distance} mm`;
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.dist}
          <span className="value">{getValueCaption()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div>
            <div className="control offset-dist">
              <UnitInput defaultValue={distance} getValue={(val) => updateDist(val)} min={0} unit="mm" />
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetDistancePanel;
