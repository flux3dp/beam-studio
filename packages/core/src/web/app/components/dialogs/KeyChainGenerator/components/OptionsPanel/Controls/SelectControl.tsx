import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { Select } from 'antd';

import styles from './Base.module.scss';

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectControlProps<T extends string> {
  label: string;
  onChange: (value: T) => void;
  options: Array<SelectOption<T>>;
  value: T;
  width?: number;
}

const SelectControl = <T extends string>({
  label,
  onChange,
  options,
  value,
  width = 120,
}: SelectControlProps<T>): ReactNode => (
  <div className={styles.container}>
    <div className={styles.header}>
      <div className={styles.label}>{label}</div>
      <Select onChange={onChange} options={options} size="middle" style={{ width }} value={value} />
    </div>
  </div>
);

SelectControl.displayName = 'SelectControl';

export default memo(SelectControl) as typeof SelectControl;
