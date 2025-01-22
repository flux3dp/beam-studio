import React from 'react';

import SelectControl from '@core/app/components/settings/SelectControl';
import type { OptionValues } from '@core/app/constants/enums';
import isDev from '@core/helpers/is-dev';

interface Props {
  multipassCompensationOptions: Array<{ label: string; selected: boolean; value: OptionValues }>;
  oneWayPrintingOptions: Array<{ label: string; selected: boolean; value: OptionValues }>;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Experimental({
  multipassCompensationOptions,
  oneWayPrintingOptions,
  updateBeamboxPreferenceChange,
}: Props): React.JSX.Element {
  if (!isDev()) {
    return null;
  }

  return (
    <>
      <div className="subtitle">Experimental Features</div>
      <SelectControl
        id="multipass-compensation"
        label="Multipass Compensation"
        onChange={(e) => updateBeamboxPreferenceChange('multipass-compensation', e.target.value)}
        options={multipassCompensationOptions}
      />
      <SelectControl
        id="one-way-printing"
        label="One-way Printing"
        onChange={(e) => updateBeamboxPreferenceChange('one-way-printing', e.target.value)}
        options={oneWayPrintingOptions}
      />
    </>
  );
}

export default Experimental;
