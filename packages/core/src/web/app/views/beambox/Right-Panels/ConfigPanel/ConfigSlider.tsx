import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import type { TooltipProps } from 'antd';
import { ConfigProvider, Slider } from 'antd';
import classNames from 'classnames';

import units from '@core/helpers/units';
import type ConfigOption from '@core/interfaces/ConfigOption';

import styles from './ConfigSlider.module.scss';

interface Props {
  decimal?: number;
  id?: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  options?: ConfigOption[];
  speedLimit?: boolean;
  step?: number;
  unit?: string;
  value: number;
}

const ConfigSlider = ({
  decimal = 0,
  id,
  max,
  min,
  onChange,
  options,
  speedLimit = false,
  step = 1,
  unit,
  value,
}: Props) => {
  // If value is not in options, add the value to options
  const sliderOptions = useMemo(() => {
    if (!options) {
      return undefined;
    }

    const newOptions = [...options];

    for (let i = 0; i < options.length; i += 1) {
      if (options[i].value === value) {
        return newOptions;
      }

      if (options[i].value > value) {
        newOptions.splice(i, 0, { label: `${value}`, value });

        return newOptions;
      }
    }
    newOptions.push({ label: `${value}`, value });

    return newOptions;
  }, [value, options]);

  const optionValues = useMemo(() => sliderOptions?.map((option) => option.value), [sliderOptions]);
  const optionLabels = useMemo(() => sliderOptions?.map((option) => option.label ?? option.value), [sliderOptions]);
  const fakeUnit = useMemo(() => (unit?.includes('in') ? 'inch' : 'mm'), [unit]);
  const getDisplayValueFromValue = useCallback(
    (val: number) => {
      if (optionValues) {
        return optionValues.indexOf(val);
      }

      return val;
    },
    [optionValues],
  );

  const [displayValue, setDisplayValue] = useState(getDisplayValueFromValue(value));

  useEffect(() => setDisplayValue(getDisplayValueFromValue(value)), [value, getDisplayValueFromValue]);

  const handleAfterChange = (val: number) => {
    if (optionValues) {
      onChange(optionValues[val]);
    } else {
      onChange(val);
    }
  };

  const handleChange = (val: number) => {
    setDisplayValue(val);
  };
  const maxValue = sliderOptions ? sliderOptions.length - 1 : max;

  return (
    <div className={classNames(styles.container, { [styles.limit]: speedLimit })} id={id}>
      <ConfigProvider
        theme={{
          components: {
            Slider: {
              dotActiveBorderColor: '#494949',
              handleActiveColor: '#494949',
              handleColor: '#cecece',
              trackBg: 'transparent',
              trackBgDisabled: 'transparent',
              trackHoverBg: 'transparent',
            },
          },
          token: {
            colorPrimary: '#494949',
            colorPrimaryBorder: '#cecece',
            colorPrimaryBorderHover: '#494949',
          },
        }}
      >
        <Slider
          max={sliderOptions ? sliderOptions.length - 1 : max}
          min={sliderOptions ? 0 : min}
          onAfterChange={handleAfterChange}
          onChange={handleChange}
          step={sliderOptions ? 1 : step}
          tooltip={
            {
              arrow: { pointAtCenter: true },
              formatter: (val: number) =>
                sliderOptions ? optionLabels[val] : units.convertUnit(val, fakeUnit, 'mm').toFixed(decimal),
              // hack because antd tooltip of slider won't autoslide
              placement: displayValue === maxValue ? 'topLeft' : 'top',
            } as TooltipProps as any
          }
          value={displayValue}
        />
      </ConfigProvider>
    </div>
  );
};

export default memo(ConfigSlider);
