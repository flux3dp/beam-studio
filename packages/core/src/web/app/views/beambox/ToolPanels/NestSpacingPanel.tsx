import React from 'react';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

import storage from '@app/implementations/storage';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  onValueChange: (val: number) => void;
  spacing: number;
}

function NestSpacingPanel({ onValueChange, spacing: spacingProps }: Props): React.JSX.Element {
  const [spacing, updateSpacing] = React.useState(spacingProps);

  const updateVal = (val) => {
    onValueChange(val);
    updateSpacing(val);
  };

  const getValueCaption = () => {
    const units = storage.get('default-units') || 'mm';

    return units === 'inches' ? `${Number(spacing / 25.4).toFixed(3)}"` : `${spacing} mm`;
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption">
          {LANG._nest.spacing}
          <span className="value">{getValueCaption()}</span>
        </p>
        <label className="accordion-body">
          <div>
            <div className="control nest-spacing">
              <UnitInput defaultValue={spacing} getValue={(val) => updateVal(val)} min={0} unit="mm" />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestSpacingPanel;
