import classNames from 'classnames';
import React from 'react';

import i18n from 'helpers/i18n';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/Unit-Input-v2';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  distance: number;
  onValueChange: (val: number) => void;
}

function OffsetDistancePanel({ distance: distanceProps, onValueChange }: Props): JSX.Element {
  const [distance, updateDistance] = React.useState(distanceProps);
  const [isCollapsed, updateIsCollapsed] = React.useState(false);

  const updateDist = (val: number) => {
    onValueChange(val);
    updateDistance(val);
  };

  const getValueCaption = () => {
    const units = storage.get('default-units') || 'mm';
    return units === 'inches' ? `${Number(distance / 25.4).toFixed(3)}\"` : `${distance} mm`;
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption" onClick={() => updateIsCollapsed(!isCollapsed)}>
          {LANG._offset.dist}
          <span className="value">{getValueCaption()}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div>
            <div className="control offset-dist">
              <UnitInput
                min={0}
                unit="mm"
                defaultValue={distance}
                getValue={(val) => updateDist(val)}
              />
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

export default OffsetDistancePanel;
