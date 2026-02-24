import type { FocusEvent } from 'react';
import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { InputNumberProps, ThemeConfig } from 'antd';
import { ConfigProvider, InputNumber } from 'antd';
import classNames from 'classnames';

import styles from './UnitInput.module.scss';

export interface UnitInputProps extends InputNumberProps<number> {
  clipValue?: boolean;
  containerClassName?: string;
  displayMultiValue?: boolean;
  fireOnChange?: boolean;
  isInch?: boolean;
  theme?: ThemeConfig;
  underline?: boolean;
  unit?: string;
  unitClassName?: string;
}

/**
 * Unit Input by Antd InputNumber
 * using formatter and parser to display unit
 * if isInch is true, the unit will be inch but the value will still be mm,
 * the transfer will be handled by formatter and parser
 */
const UnitInput = ({
  clipValue = true,
  containerClassName,
  displayMultiValue = false,
  fireOnChange = false,
  isInch,
  max = Number.MAX_SAFE_INTEGER,
  min = Number.MIN_SAFE_INTEGER,
  onBlur,
  onChange,
  precision = 4,
  ref: outerRef,
  theme,
  underline,
  unit,
  unitClassName,
  ...props
}: UnitInputProps & { ref?: React.Ref<HTMLInputElement | null> }): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const valueRef = useRef<number | undefined>(); // for onChange

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(outerRef, () => {
    const input = inputRef.current;

    return input?.parentNode?.querySelector('input') || input;
  }, []);

  useEffect(() => {
    // Sync the valueRef if the value can be changed from outside
    if (valueRef.current !== undefined && typeof props.value === 'number') {
      valueRef.current = props.value;
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [props.value, valueRef.current]);

  const formatter = useCallback(
    (value: number | string = '') => {
      if (displayMultiValue) return '-';

      let newVal = typeof value === 'string' ? Number.parseFloat(value) : value;

      if (isInch) newVal /= 25.4;

      return String(Math.round(newVal * 10 ** precision) / 10 ** precision);
    },
    [isInch, displayMultiValue, precision],
  );

  const parser = useCallback(
    (input: string = '') => {
      const value = Number.parseFloat(input.trim().replaceAll(',', '.')) * (isInch ? 25.4 : 1);

      const parsedValue = clipValue ? Math.max(min, Math.min(max, value)) : value;

      return parsedValue;
    },
    [clipValue, isInch, max, min],
  );

  const handleValueChange = useCallback(
    (value: number | undefined) => {
      // Only trigger onChange if the value has changed
      if (value !== valueRef.current && !Number.isNaN(value) && value !== undefined) {
        let val = value;

        if (clipValue) {
          val = Math.max(min, Math.min(max, val));
        }

        valueRef.current = val; // Update the previous value
        onChange?.(val);
      }
    },
    [clipValue, onChange, max, min],
  );

  const handlePressEnter = useCallback(() => {
    const value = inputRef.current?.value;

    if (value !== undefined) {
      handleValueChange(parser(value));
    }
  }, [handleValueChange, parser]);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const value = inputRef.current?.value;

      if (value !== undefined) {
        handleValueChange(parser(value));
      }

      onBlur?.(e);
    },
    [handleValueChange, parser, onBlur],
  );

  const handleStep = useCallback(
    (value: number) => {
      handleValueChange(value);
    },
    [handleValueChange],
  );

  return (
    <div className={classNames(styles.input, { [styles.underline]: underline }, containerClassName)}>
      <ConfigProvider theme={theme}>
        <InputNumber
          onPressEnter={handlePressEnter}
          ref={inputRef}
          {...props}
          formatter={formatter}
          max={max}
          min={min}
          onBlur={handleBlur}
          onChange={fireOnChange ? onChange : undefined}
          onStep={handleStep}
          parser={parser}
        />
        {unit && <span className={classNames(styles.unit, unitClassName)}>{unit}</span>}
      </ConfigProvider>
    </div>
  );
};

export default UnitInput;
