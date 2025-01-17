import React, { useMemo } from 'react';
import { ConfigProvider, InputNumber } from 'antd';

import ConfigOption from 'interfaces/ConfigOption';
import UnitInput from 'app/widgets/Unit-Input-v2';

import styles from './ConfigValueDisplay.module.scss';

interface Props {
  inputId?: string;
  type?: 'default' | 'panel-item' | 'modal';
  max: number;
  min: number;
  value: number;
  unit?: string;
  hasMultiValue?: boolean;
  decimal?: number;
  onChange: (value: number) => void;
  options?: ConfigOption[];
}

const ConfigValueDisplay = ({
  inputId,
  type = 'default',
  max,
  min,
  value,
  unit,
  hasMultiValue = false,
  decimal = 0,
  onChange,
  options,
}: Props): JSX.Element => {
  const selectedOption = options?.find((opt) => opt.value === value);
  const ratio = useMemo(() => (unit?.includes('in') ? 25.4 : 1), [unit]);
  if (selectedOption)
    return (
      <span className={styles.value}>
        {hasMultiValue ? '-' : selectedOption.label || selectedOption.value}
      </span>
    );
  if (type === 'panel-item')
    return (
      <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
        <InputNumber
          className={styles.input}
          type="number"
          min={min}
          max={max}
          suffix={unit}
          step={ratio}
          value={value}
          onChange={onChange}
          formatter={(v, { userTyping, input }) =>
            userTyping ? input : (v / ratio).toFixed(decimal)
          }
          parser={(v) => Number(v) * ratio}
          precision={decimal}
          controls={false}
        />
      </ConfigProvider>
    );
  return (
    <UnitInput
      id={inputId}
      className={{ [styles.input]: true }}
      min={min}
      max={max}
      unit={unit}
      defaultValue={value}
      getValue={onChange}
      decimal={decimal}
      displayMultiValue={hasMultiValue}
      disabled={!!options}
    />
  );
};

export default ConfigValueDisplay;
