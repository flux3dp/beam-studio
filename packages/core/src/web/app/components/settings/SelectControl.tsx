import * as React from 'react';

import Controls from '@core/app/components/settings/Control';
import SelectView from '@core/app/widgets/Select';

interface Props {
  id?: string;
  label: string;
  onChange: (e) => void;
  options: Array<{ label: string; selected: boolean; value: any }>;
  url?: string;
}

const SelectControl = ({ id = null, label, onChange, options, url }: Props): React.JSX.Element => (
  <Controls label={label} url={url}>
    <SelectView className="font3" id={id} onChange={onChange} options={options} />
  </Controls>
);

export default SelectControl;
