import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { InputNumber, Slider } from 'antd';

import styles from './ModalBlock.module.scss';

interface Props {
  title?: string;
  label: string;
  value: number;
  max?: number;
  min?: number;
  setValue: (value: number) => void;
  color?: 'c' | 'm' | 'y' | 'k';
}

const ModalBlock = ({
  title,
  label,
  value,
  setValue,
  color,
  max = 200,
  min = 0,
}: Props): JSX.Element => {
  const [display, setDisplay] = useState(value);
  useEffect(() => setDisplay(value), [value]);

  return (
    <div className={classNames(styles.block, styles[color])}>
      {title && <div>{title}</div>}
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.input}>
          <InputNumber
            size="small"
            value={value}
            controls={false}
            min={min}
            max={max}
            onChange={setValue}
          />
          <span className={styles.unit}>%</span>
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={display}
        onAfterChange={setValue}
        onChange={(v: number) => setDisplay(v)}
        tooltip={{
          formatter: (v: number) => `${v}%`,
        }}
      />
    </div>
  );
};

export default ModalBlock;
