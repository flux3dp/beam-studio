import React from 'react';

import isDev from 'helpers/is-dev';
import SelectControl from 'app/components/settings/SelectControl';
import { OptionValues } from 'app/constants/enums';

interface Props {
  multipassCompensationOptions: { value: OptionValues; label: string; selected: boolean }[];
  oneWayPrintingOptions: { value: OptionValues; label: string; selected: boolean }[];
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Experimental({
  multipassCompensationOptions,
  oneWayPrintingOptions,
  updateBeamboxPreferenceChange,
}: Props): JSX.Element {
  if (!isDev()) return null;
  return (
    <>
      <div className="subtitle">Experimental Features</div>
      <SelectControl
        label="Multipass Compensation"
        id="multipass-compensation"
        options={multipassCompensationOptions}
        onChange={(e) => updateBeamboxPreferenceChange('multipass-compensation', e.target.value)}
      />
      <SelectControl
        label="One-way Printing"
        id="one-way-printing"
        options={oneWayPrintingOptions}
        onChange={(e) => updateBeamboxPreferenceChange('one-way-printing', e.target.value)}
      />
    </>
  );
}

export default Experimental;
