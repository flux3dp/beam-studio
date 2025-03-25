import React, { useCallback } from 'react';

import UnitInput from '@core/app/widgets/UnitInput';
import type ConfigOption from '@core/interfaces/ConfigOption';

import styles from './ConfigValueDisplay.module.scss';
import Input from './Input';

interface Props {
  decimal?: number;
  hasMultiValue?: boolean;
  inputId?: string;
  isInch?: boolean;
  max: number;
  min: number;
  onChange: (value: number) => void;
  options?: ConfigOption[];
  type?: 'default' | 'modal' | 'panel-item';
  unit?: string;
  value: number;
}

const ConfigValueDisplay = ({
  decimal = 0,
  hasMultiValue = false,
  inputId,
  isInch,
  max,
  min,
  onChange,
  options,
  type = 'default',
  unit,
  value,
}: Props): React.JSX.Element => {
  const selectedOption = options?.find((opt) => opt.value === value);

  const handleChange = useCallback(
    (val: null | number) => {
      if (val !== null) onChange(val);
    },
    [onChange],
  );

  if (selectedOption) {
    return <span className={styles.value}>{hasMultiValue ? '-' : selectedOption.label || selectedOption.value}</span>;
  }

  if (isInch === undefined) isInch = unit?.includes('in');

  if (type === 'panel-item') {
    return (
      <UnitInput
        className={styles.input}
        containerClassName={styles['panel-item']}
        controls={false}
        isInch={isInch}
        max={max}
        min={min}
        onChange={handleChange}
        precision={decimal}
        step={isInch ? 25.4 : 1}
        suffix={unit}
        theme={{ token: { borderRadius: 100 } }}
        type="number"
        value={value}
      />
    );
  }

  return (
    <Input
      disabled={Boolean(options)}
      hasMultiValue={hasMultiValue}
      id={inputId}
      isInch={isInch}
      max={max}
      min={min}
      onChange={handleChange}
      precision={decimal}
      unit={unit}
      value={value}
    />
  );
};

export default ConfigValueDisplay;
