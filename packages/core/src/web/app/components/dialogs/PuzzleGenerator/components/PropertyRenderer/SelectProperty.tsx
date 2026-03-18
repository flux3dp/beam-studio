import React from 'react';

import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import type { SelectPropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const SelectProperty = ({ getValue, property, setValue }: BasePropertyProps<SelectPropertyDef>): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const value = (getValue(property.key) as number | string) ?? property.default;

  return (
    <div className={styles['select-row']}>
      <div className={styles['property-label']}>{t[property.labelKey]}</div>
      <Select onChange={(val) => setValue(property.key, val)} onKeyDown={(e) => e.stopPropagation()} value={value}>
        {property.options.map((opt) => (
          <Select.Option key={opt.value} value={opt.value}>
            {t[opt.labelKey]}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default SelectProperty;
