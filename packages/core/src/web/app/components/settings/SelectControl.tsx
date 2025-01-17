import * as React from 'react';

import Controls from 'app/components/settings/Control';
import SelectView from 'app/widgets/Select';

interface Props {
  id?: string,
  label: string,
  url?: string,
  onChange: (e) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { value: any, label: string, selected: boolean }[],
}

const SelectControl = ({
  id = null, url, label, onChange, options,
}: Props): JSX.Element => (
  <Controls label={label} url={url}>
    <SelectView
      id={id}
      className="font3"
      options={options}
      onChange={onChange}
    />
  </Controls>
);

export default SelectControl;
