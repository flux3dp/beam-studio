import React, { useEffect, useState } from 'react';

import { InputNumber, Slider } from 'antd';
import classNames from 'classnames';

import styles from './ModalBlock.module.scss';

interface Props {
  color?: 'c' | 'k' | 'm' | 'y';
  label: string;
  max?: number;
  min?: number;
  setValue: (value: number) => void;
  title?: string;
  unit?: string;
  value: number;
}

const ModalBlock = ({ color, label, max = 200, min = 0, setValue, title, unit, value }: Props): React.JSX.Element => {
  const [display, setDisplay] = useState(value);

  useEffect(() => setDisplay(value), [value]);

  return (
    <div className={classNames(styles.block, color ? styles[color] : undefined)}>
      {title && <div>{title}</div>}
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.input}>
          <InputNumber
            controls={false}
            max={max}
            min={min}
            onChange={(newVal) => {
              if (newVal === null) return;

              setValue(newVal);
            }}
            size="small"
            suffix={unit}
            value={value}
          />
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        onChange={(v: number) => setDisplay(v)}
        onChangeComplete={setValue}
        step={1}
        tooltip={{
          formatter: (v) => `${v ?? 0}${unit || ''}`,
        }}
        value={display}
      />
    </div>
  );
};

export default ModalBlock;
