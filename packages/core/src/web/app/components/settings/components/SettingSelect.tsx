import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

import SettingFormItem from './SettingFormItem';

type Props = {
  defaultValue: boolean | number | string;
  id: string;
  label: string;
  onChange: (value: any) => void;
  options: DefaultOptionType[];
  url?: string;
  value?: string;
};

function SettingSelect({ defaultValue, id, label, onChange, options, url, value }: Props) {
  return (
    <SettingFormItem id={`${id}-label`} label={label} url={url}>
      <Select
        defaultValue={defaultValue}
        id={id}
        onChange={onChange}
        options={options}
        // must use style instead of className, to prevent being overridden by antd form item
        style={{ width: 240 }}
        value={value}
      />
    </SettingFormItem>
  );
}

export default SettingSelect;
