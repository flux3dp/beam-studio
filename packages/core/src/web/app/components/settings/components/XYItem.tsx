import React from 'react';

import classNames from 'classnames';

import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';

import styles from '../Settings.module.scss';

import SettingFormItem from './SettingFormItem';

interface Props {
  id: string;
  label: string;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  onChange: (axis: 'x' | 'y', value: number) => void;
  tooltip?: string;
  unitInputProps: Partial<SettingUnitInputProps>;
  values: [number, number];
}

const XYItem = ({
  id,
  label,
  maxX,
  maxY,
  minX,
  minY,
  onChange,
  tooltip,
  unitInputProps,
  values: [x, y],
}: Props): React.JSX.Element => (
  <SettingFormItem id={id} label={label} tooltip={tooltip}>
    <div className={styles['xy-item']}>
      <div className={styles['xy-set']}>
        <span className={classNames('font2', styles['xy-label'])}>X</span>
        <SettingUnitInput
          {...unitInputProps}
          id={`${id}-x`}
          max={maxX}
          min={minX}
          onChange={(val) => onChange('x', val)}
          value={x}
        />
      </div>
      <div className={styles['xy-set']}>
        <span className={classNames('font2', styles['xy-label'])}>Y</span>
        <SettingUnitInput
          {...unitInputProps}
          id={`${id}-y`}
          max={maxY}
          min={minY}
          onChange={(val) => onChange('y', val)}
          value={y}
        />
      </div>
    </div>
  </SettingFormItem>
);

export default XYItem;
