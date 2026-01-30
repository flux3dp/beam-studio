import React, { useCallback, useMemo } from 'react';

import UnitInput from '@core/app/widgets/UnitInput';
import type ConfigOption from '@core/interfaces/ConfigOption';
import type { OneOf } from '@core/interfaces/utils';

import styles from './ConfigValueDisplay.module.scss';
import Input from './Input';

type Props = OneOf<{ max: number; min: number }, { options: ConfigOption[] }> & {
  decimal?: number;
  hasMultiValue?: boolean;
  inputId?: string;
  isInch?: boolean;
  onChange: (value: number) => void;
  step?: number;
  type?: 'default' | 'modal' | 'panel-item';
  unit?: string;
  value: number;
};

const ConfigValueDisplay = ({
  decimal = 0,
  hasMultiValue = false,
  inputId,
  isInch,
  max,
  min,
  onChange,
  options,
  step = 1,
  type = 'default',
  unit,
  value,
}: Props): React.JSX.Element => {
  const selectedOption = useMemo(() => options?.find((opt) => opt.value === value), [options, value]);

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
        step={step}
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
      step={step}
      unit={unit}
      value={value}
    />
  );
};

export default ConfigValueDisplay;
