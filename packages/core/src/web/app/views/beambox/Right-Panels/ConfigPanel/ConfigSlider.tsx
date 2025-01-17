import classNames from 'classnames';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Slider, TooltipProps } from 'antd';

import ConfigOption from 'interfaces/ConfigOption';
import units from 'helpers/units';

import styles from './ConfigSlider.module.scss';

interface Props {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  speedLimit?: boolean;
  options?: ConfigOption[];
  unit?: string;
  decimal?: number;
}

const ConfigSlider = ({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  speedLimit = false,
  options,
  unit,
  decimal = 0,
}: Props) => {
  // If value is not in options, add the value to options
  const sliderOptions = useMemo(() => {
    if (!options) return undefined;
    const newOptions = [...options];
    for (let i = 0; i < options.length; i += 1) {
      if (options[i].value === value) return newOptions;
      if (options[i].value > value) {
        newOptions.splice(i, 0, { value, label: `${value}` });
        return newOptions;
      }
    }
    newOptions.push({ value, label: `${value}` });
    return newOptions;
  }, [value, options]);

  const optionValues = useMemo(() => sliderOptions?.map((option) => option.value), [sliderOptions]);
  const optionLabels = useMemo(
    () => sliderOptions?.map((option) => option.label ?? option.value),
    [sliderOptions]
  );
  const fakeUnit = useMemo(() => (unit?.includes('in') ? 'inch' : 'mm'), [unit]);
  const getDisplayValueFromValue = useCallback(
    (val: number) => {
      if (optionValues) return optionValues.indexOf(val);
      return val;
    },
    [optionValues]
  );

  const [displayValue, setDisplayValue] = useState(getDisplayValueFromValue(value));
  useEffect(
    () => setDisplayValue(getDisplayValueFromValue(value)),
    [value, getDisplayValueFromValue]
  );

  const handleAfterChange = (val: number) => {
    if (optionValues) onChange(optionValues[val]);
    else onChange(val);
  };

  const handleChange = (val: number) => {
    setDisplayValue(val);
  };
  const maxValue = sliderOptions ? sliderOptions.length - 1 : max;
  return (
    <div id={id} className={classNames(styles.container, { [styles.limit]: speedLimit })}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimaryBorder: '#cecece',
            colorPrimaryBorderHover: '#494949',
            colorPrimary: '#494949',
          },
          components: {
            Slider: {
              handleColor: '#cecece',
              handleActiveColor: '#494949',
              dotActiveBorderColor: '#494949',
              trackBg: 'transparent',
              trackBgDisabled: 'transparent',
              trackHoverBg: 'transparent',
            },
          },
        }}
      >
        <Slider
          min={sliderOptions ? 0 : min}
          max={sliderOptions ? sliderOptions.length - 1 : max}
          step={sliderOptions ? 1 : step}
          value={displayValue}
          onAfterChange={handleAfterChange}
          onChange={handleChange}
          tooltip={
            {
              formatter: (val: number) =>
                sliderOptions
                  ? optionLabels[val]
                  : units.convertUnit(val, fakeUnit, 'mm').toFixed(decimal),
              // hack because antd tooltip of slider won't autoslide
              placement: displayValue === maxValue ? 'topLeft' : 'top',
              arrow: { pointAtCenter: true },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as TooltipProps as any
          }
        />
      </ConfigProvider>
    </div>
  );
};

export default memo(ConfigSlider);
