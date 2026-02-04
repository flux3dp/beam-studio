import React from 'react';

import type { ThemeConfig } from 'antd';

import { configPanelInputTheme } from '@core/app/constants/antd-config';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from './Input.module.scss';

interface Props {
  disabled?: boolean;
  hasMultiValue?: boolean;
  id?: string;
  isInch?: boolean;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  precision?: number;
  step?: number;
  theme?: ThemeConfig;
  unit?: string;
  value: number;
}

// TODO: replace unit input in config panel with this
export const Input = ({
  disabled,
  hasMultiValue,
  id,
  isInch,
  max,
  min,
  onChange,
  precision,
  step,
  theme = configPanelInputTheme,
  unit,
  value,
}: Props) => {
  if (isInch === undefined) isInch = unit?.includes('in');

  return (
    <UnitInput
      containerClassName={styles.input}
      controls={false}
      disabled={disabled}
      displayMultiValue={hasMultiValue}
      id={id}
      isInch={isInch}
      max={max}
      min={min}
      onChange={(val) => {
        if (val !== null) onChange(val);
      }}
      precision={precision}
      step={step}
      theme={theme}
      underline
      unit={unit}
      unitClassName={styles.unit}
      value={value}
    />
  );
};

export default Input;
