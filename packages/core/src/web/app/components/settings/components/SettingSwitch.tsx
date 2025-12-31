import React from 'react';

import { Switch } from 'antd';

import SettingFormItem from './SettingFormItem';

interface SettingSwitchProps {
  checked: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
  tooltip?: string;
  url?: string;
}

const SettingSwitch = ({
  checked,
  disabled = false,
  id,
  label,
  onChange,
  tooltip,
  url,
}: SettingSwitchProps): React.JSX.Element => (
  <SettingFormItem id={`${id}-label`} label={label} tooltip={tooltip} url={url}>
    <Switch checked={checked} disabled={disabled} id={id} onChange={onChange} />
  </SettingFormItem>
);

export default SettingSwitch;
