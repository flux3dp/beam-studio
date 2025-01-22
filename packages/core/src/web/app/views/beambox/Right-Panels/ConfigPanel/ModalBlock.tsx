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
  value: number;
}

const ModalBlock = ({ color, label, max = 200, min = 0, setValue, title, value }: Props): React.JSX.Element => {
  const [display, setDisplay] = useState(value);

  useEffect(() => setDisplay(value), [value]);

  return (
    <div className={classNames(styles.block, styles[color])}>
      {title && <div>{title}</div>}
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.input}>
          <InputNumber controls={false} max={max} min={min} onChange={setValue} size="small" value={value} />
          <span className={styles.unit}>%</span>
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        onAfterChange={setValue}
        onChange={(v: number) => setDisplay(v)}
        step={1}
        tooltip={{
          formatter: (v: number) => `${v}%`,
        }}
        value={display}
      />
    </div>
  );
};

export default ModalBlock;
