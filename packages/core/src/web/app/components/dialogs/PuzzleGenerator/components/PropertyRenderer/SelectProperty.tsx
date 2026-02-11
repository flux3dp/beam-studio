import React from 'react';

import Select from '@core/app/widgets/AntdSelect';

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

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>{getLabel(property.labelKey)}</div>
      <Select
        onChange={(val) => setValue(property.key, val)}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ width: '100%' }}
        value={value}
      >
        {property.options.map((opt) => (
          <Select.Option key={opt.value} value={opt.value}>
            {getLabel(opt.labelKey)}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default SelectProperty;
