import React from 'react';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  onValueChange: (val: number) => void;
  rotations: number;
}

function NestRotationPanel({ onValueChange, rotations: rotationsProps }: Props): React.JSX.Element {
  const [rotations, updateRotations] = React.useState(rotationsProps);

  const updateVal = (val) => {
    onValueChange(val);
    updateRotations(val);
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption">
          {LANG._nest.rotations}
          <span className="value">{rotations.toString()}</span>
        </p>
        <label className="accordion-body">
          <div>
            <div className="control nest-rotations">
              <UnitInput decimal={0} defaultValue={rotations} getValue={updateVal} min={1} unit="" />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestRotationPanel;
