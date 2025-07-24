import React, { useEffect, useState } from 'react';

import { Slider } from 'antd';
import classNames from 'classnames';

import styles from '../ModalBlock.module.scss';

interface Props {
  color: 'c' | 'k' | 'm' | 'y';
  setValue?: (value: number[]) => void;
  title?: string;
  value: number[];
}

const ColorCurveControl = ({ color, setValue, title, value }: Props) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => setDisplay(value), [value]);

  return (
    <div className={classNames(styles.block, styles[color])}>
      {title && <div>{title}</div>}
      <Slider
        max={255}
        min={0}
        onChange={(v: number[]) => setDisplay(v)}
        onChangeComplete={setValue}
        range={{
          maxCount: 5,
          minCount: 5,
        }}
        step={1}
        value={display}
      />
    </div>
  );
};

export default ColorCurveControl;
