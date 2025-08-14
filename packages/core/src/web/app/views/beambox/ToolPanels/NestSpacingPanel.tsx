import React from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  onValueChange: (val: number) => void;
  spacing: number;
}

function NestSpacingPanel({ onValueChange, spacing: spacingProps }: Props): React.JSX.Element {
  const [spacing, updateSpacing] = React.useState(spacingProps);
  const isInch = useStorageStore((state) => state['default-units'] === 'inches');

  const updateVal = (val: number) => {
    onValueChange(val);
    updateSpacing(val);
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption">
          {LANG._nest.spacing}
          <span className="value">{isInch ? `${Number(spacing / 25.4).toFixed(3)}"` : `${spacing} mm`}</span>
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
