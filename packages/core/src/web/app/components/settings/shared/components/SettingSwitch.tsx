import React from 'react';

import { Switch } from 'antd';

import SettingFormItem from './SettingFormItem';

interface SettingSwitchProps {
  checked: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
  tooltip?: string;
  url?: string;
}

const SettingSwitch = ({
  checked,
  disabled = false,
  icon,
  id,
  label,
  onChange,
  tooltip,
  url,
}: SettingSwitchProps): React.JSX.Element => (
  <SettingFormItem icon={icon} id={`${id}-label`} label={label} tooltip={tooltip} url={url}>
    <Switch checked={checked} disabled={disabled} id={id} onChange={onChange} />
  </SettingFormItem>
);

export default SettingSwitch;
