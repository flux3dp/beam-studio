import React from 'react';

import i18n from 'helpers/i18n';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/Unit-Input-v2';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  spacing: number,
  onValueChange: (val: number) => void,
}

function NestSpacingPanel({ spacing: spacingProps, onValueChange }: Props): JSX.Element {
  const [spacing, updateSpacing] = React.useState(spacingProps);

  const updateVal = (val) => {
    onValueChange(val);
    updateSpacing(val);
  };

  const getValueCaption = () => {
    const units = storage.get('default-units') || 'mm';
    return units === 'inches' ? `${Number(spacing / 25.4).toFixed(3)}\"` : `${spacing} mm`;
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption">
          {LANG._nest.spacing}
          <span className="value">{getValueCaption()}</span>
        </p>
        <label className="accordion-body">
          <div>
            <div className="control nest-spacing">
              <UnitInput
                min={0}
                unit="mm"
                defaultValue={spacing}
                getValue={(val) => updateVal(val)}
              />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestSpacingPanel;
