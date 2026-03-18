import React from 'react';

import { Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { TogglePropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const ToggleProperty = ({ getValue, property, setValue }: BasePropertyProps<TogglePropertyDef>): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const value = (getValue(property.key) as boolean) ?? property.default;

  return (
    <div className={styles['toggle-row']}>
      <div className={styles['property-label']}>{t[property.labelKey]}</div>
      <Switch checked={value} onChange={(checked) => setValue(property.key, checked)} />
    </div>
  );
};

export default ToggleProperty;
