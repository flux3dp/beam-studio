import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

import type { OneOf } from '@core/interfaces/utils';

import SettingFormItem from './SettingFormItem';

type CommonProps = {
  id: string;
  label: string;
  onChange: (value: any) => void;
  options: DefaultOptionType[];
  tooltip?: string;
  url?: string;
};

type Props = CommonProps & OneOf<{ defaultValue: boolean | number | string }, { value: string }>;

function SettingSelect({ defaultValue, id, label, onChange, options, tooltip, url, value }: Props) {
  return (
    <SettingFormItem id={`${id}-label`} label={label} tooltip={tooltip} url={url}>
      <Select
        defaultValue={defaultValue}
        id={id}
        onChange={onChange}
        options={options}
        // for mobile dropdown display
        popupMatchSelectWidth={false}
        // must use style instead of className, to prevent being overridden by antd form item
        style={{ width: 240 }}
        value={value}
      />
    </SettingFormItem>
  );
}

export default SettingSelect;
