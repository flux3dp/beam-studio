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
    <span className={classNames('font2', styles['sub-item'])}>X</span>
    <SettingUnitInput
      {...unitInputProps}
      containerClassName={styles['sub-item']}
      id={`${id}-x`}
      max={maxX}
      min={minX}
      onChange={(val) => onChange('x', val)}
      value={x}
    />
    <span className={classNames('font2', styles['sub-item'])}>Y</span>
    <SettingUnitInput
      {...unitInputProps}
      containerClassName={styles['sub-item']}
      id={`${id}-y`}
      max={maxY}
      min={minY}
      onChange={(val) => onChange('y', val)}
      value={y}
    />
  </SettingFormItem>
);

export default XYItem;
