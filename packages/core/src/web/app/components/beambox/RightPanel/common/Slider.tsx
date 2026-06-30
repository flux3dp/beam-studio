import React, { useEffect, useState } from 'react';

import type { SliderSingleProps } from 'antd';
import { Slider as AntdSlider } from 'antd';
import classNames from 'classnames';

import { formatter } from '@core/helpers/config/convert';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import styles from './Slider.module.scss';

type Props = SliderSingleProps & {
  config: NumberOptionConfig;
  isInch?: boolean;
  onChange: (val: number, addToHistory?: boolean) => Promise<void> | void;
  value: number;
};

type State = {
  isPreviewing: boolean;
  original: null | number;
  previewValue: number;
};

const Slider = ({ className, config, isInch, onChange, value, ...props }: Props): React.JSX.Element => {
  const [previewState, setPreviewState] = useState<State>({ isPreviewing: false, original: null, previewValue: value });
  const { id, max, min, sliderMax, sliderMin, sliderStep, step } = config ?? {};

  useEffect(() => {
    // Note: this only sync value changes after onChangeComplete
    // If result value from onChange is different from input value, the value may be incorrect
    setPreviewState((prev) => (prev.isPreviewing ? prev : { ...prev, previewValue: value }));
  }, [value]);

  return (
    <AntdSlider
      id={id ? `${id}-slider` : undefined}
      max={sliderMax ?? max}
      min={sliderMin ?? min}
      step={sliderStep ?? step}
      tooltip={{
        formatter: (val: number | undefined) => formatter(val, { config, isInch, withUnit: true }),
      }}
      {...props}
      className={classNames(styles.slider, className)}
      onChange={(val) => {
        console.log('onChange', value, val);
        setPreviewState((prev) => ({
          isPreviewing: true,
          original: prev.original ?? value,
          previewValue: val,
        }));
        onChange(val, false);
      }}
      onChangeComplete={async (val) => {
        if (previewState.original !== null) await onChange(previewState.original, false);

        onChange(val, true);
        setPreviewState({
          isPreviewing: false,
          original: null,
          previewValue: val,
        });
      }}
      value={previewState.previewValue}
    />
  );
};

export default Slider;
