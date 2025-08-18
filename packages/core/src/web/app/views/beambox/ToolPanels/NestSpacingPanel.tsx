import React from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import useI18n from '@core/helpers/useI18n';

interface Props {
  onValueChange: (val: number) => void;
  spacing: number;
}

function NestSpacingPanel({ onValueChange, spacing: spacingProps }: Props): React.JSX.Element {
  const lang = useI18n().beambox.tool_panels;
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
          {lang._nest.spacing}
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
