import React from 'react';

import { Select } from 'antd';

import type { SelectPropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const SelectProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<SelectPropertyDef>): React.JSX.Element => {
  const value = (getValue(property.key) as number | string) ?? property.default;

  const options = property.options.map((opt) => ({
    label: getLabel(opt.labelKey),
    value: opt.value,
  }));

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>{getLabel(property.labelKey)}</div>
      <Select
        onChange={(val) => setValue(property.key, val)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        popupMatchSelectWidth={false}
        style={{ width: '100%' }}
        value={value}
      />
    </div>
  );
};

export default SelectProperty;
