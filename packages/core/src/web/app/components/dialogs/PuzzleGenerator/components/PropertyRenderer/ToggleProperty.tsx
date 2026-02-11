import React from 'react';

import { Switch } from 'antd';

import type { TogglePropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const ToggleProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<TogglePropertyDef>): React.JSX.Element => {
  const value = (getValue(property.key) as boolean) ?? property.default;

  return (
    <div className={styles['property-row']} style={{ alignItems: 'center', flexDirection: 'row' }}>
      <div className={styles['property-label']} style={{ flex: 1 }}>
        {getLabel(property.labelKey)}
      </div>
      <Switch checked={value} onChange={(checked) => setValue(property.key, checked)} />
    </div>
  );
};

export default ToggleProperty;
