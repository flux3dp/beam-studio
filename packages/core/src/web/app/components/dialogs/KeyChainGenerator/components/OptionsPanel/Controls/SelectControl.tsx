import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { Select } from 'antd';
import type { SelectProps } from 'antd/lib';

import styles from './Base.module.scss';

interface SelectOption<T extends string> {
  label: ReactNode;
  value: T;
}

interface SelectControlProps<T extends string> {
  disabled?: boolean;
  filterOption?: (input: string, option?: SelectOption<T>) => boolean;
  label: string;
  onChange: (value: T) => void;
  options: Array<SelectOption<T>>;
  placement?: SelectProps['placement'];
  popupMatchSelectWidth?: boolean;
  showSearch?: boolean;
  value: T;
  width?: number;
}

const SelectControl = <T extends string>({
  disabled = false,
  filterOption,
  label,
  onChange,
  options,
  placement,
  popupMatchSelectWidth,
  showSearch,
  value,
  width = 120,
}: SelectControlProps<T>): ReactNode => (
  <div className={styles.container}>
    <div className={styles.header}>
      <div className={styles.label}>{label}</div>
      <Select
        disabled={disabled}
        filterOption={filterOption}
        onChange={onChange}
        options={options}
        placement={placement}
        popupMatchSelectWidth={popupMatchSelectWidth}
        showSearch={showSearch}
        size="middle"
        style={{ width }}
        value={value}
      />
    </div>
  </div>
);

SelectControl.displayName = 'SelectControl';

export default memo(SelectControl) as typeof SelectControl;
