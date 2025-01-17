import React from 'react';

import i18n from 'helpers/i18n';
import UnitInput from 'app/widgets/Unit-Input-v2';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  rotations: number,
  onValueChange: (val: number) => void,
}

function NestRotationPanel({ rotations: rotationsProps, onValueChange }: Props): JSX.Element {
  const [rotations, updateRotations] = React.useState(rotationsProps);

  const updateVal = (val) => {
    onValueChange(val);
    updateRotations(val);
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption">
          {LANG._nest.rotations}
          <span className="value">{rotations.toString()}</span>
        </p>
        <label className="accordion-body">
          <div>
            <div className="control nest-rotations">
              <UnitInput
                min={1}
                decimal={0}
                unit=""
                defaultValue={rotations}
                getValue={updateVal}
              />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestRotationPanel;
