import type { FocusEvent } from 'react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { InputNumberProps, ThemeConfig } from 'antd';
import { ConfigProvider, InputNumber } from 'antd';
import classNames from 'classnames';

import styles from './UnitInput.module.scss';

interface Props extends InputNumberProps<number> {
  clipValue?: boolean;
  fireOnChange?: boolean;
  isInch?: boolean;
  theme?: ThemeConfig;
  underline?: boolean;
  unit?: string;
}

/**
 * Unit Input by Antd InputNumber
 * using formatter and parser to display unit
 * if isInch is true, the unit will be inch but the value will still be mm,
 * the transfer will be handled by formatter and parser
 */
const UnitInput = forwardRef<HTMLInputElement | null, Props>(
  (
    {
      clipValue = true,
      fireOnChange = false,
      isInch,
      onBlur,
      onChange,
      precision = 4,
      theme,
      underline,
      unit,
      ...props
    }: Props,
    outerRef,
  ): React.JSX.Element => {
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
    }, [props.value]);

    const formatter = useCallback(
      (value: number | string = '') => {
        let newVal = typeof value === 'string' ? Number.parseFloat(value) : value;

        if (isInch) {
          newVal /= 25.4;
        }

        return String(Math.round(newVal * 10 ** precision) / 10 ** precision);
      },
      [isInch, precision],
    );

    const parser = useCallback(
      (value: string = '') => Number.parseFloat(value.trim().replaceAll(',', '.')) * (isInch ? 25.4 : 1),
      [isInch],
    );

    const handleValueChange = useCallback(
      (value: number | undefined) => {
        // Only trigger onChange if the value has changed
        if (value !== valueRef.current && !Number.isNaN(value) && value !== undefined) {
          let val = value;

          if (clipValue) {
            if (props.max && val > props.max) {
              val = props.max;
            } else if (props.min && val < props.min) {
              val = props.min;
            }
          }

          valueRef.current = val; // Update the previous value
          onChange?.(val);
        }
      },
      [clipValue, onChange, props.max, props.min],
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
      <div className={classNames(styles.input, { [styles.underline]: underline })}>
        <ConfigProvider theme={theme}>
          <InputNumber
            onPressEnter={handlePressEnter}
            ref={inputRef}
            {...props}
            formatter={formatter}
            onBlur={handleBlur}
            onChange={fireOnChange ? onChange : undefined}
            onStep={handleStep}
            parser={parser}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </ConfigProvider>
      </div>
    );
  },
);

export default UnitInput;
