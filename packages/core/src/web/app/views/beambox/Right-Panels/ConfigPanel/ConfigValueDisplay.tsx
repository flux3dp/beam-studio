import React, { useMemo } from 'react';

import { ConfigProvider, InputNumber } from 'antd';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import type ConfigOption from '@core/interfaces/ConfigOption';

import styles from './ConfigValueDisplay.module.scss';

interface Props {
  decimal?: number;
  hasMultiValue?: boolean;
  inputId?: string;
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
  max,
  min,
  onChange,
  options,
  type = 'default',
  unit,
  value,
}: Props): React.JSX.Element => {
  const selectedOption = options?.find((opt) => opt.value === value);
  const ratio = useMemo(() => (unit?.includes('in') ? 25.4 : 1), [unit]);

  if (selectedOption) {
    return <span className={styles.value}>{hasMultiValue ? '-' : selectedOption.label || selectedOption.value}</span>;
  }

  if (type === 'panel-item') {
    return (
      <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
        <InputNumber
          className={styles.input}
          controls={false}
          formatter={(v, { input, userTyping }) => (userTyping ? input : (v / ratio).toFixed(decimal))}
          max={max}
          min={min}
          onChange={onChange}
          parser={(v) => Number(v) * ratio}
          precision={decimal}
          step={ratio}
          suffix={unit}
          type="number"
          value={value}
        />
      </ConfigProvider>
    );
  }

  return (
    <UnitInput
      className={{ [styles.input]: true }}
      decimal={decimal}
      defaultValue={value}
      disabled={!!options}
      displayMultiValue={hasMultiValue}
      getValue={onChange}
      id={inputId}
      max={max}
      min={min}
      unit={unit}
    />
  );
};

export default ConfigValueDisplay;
