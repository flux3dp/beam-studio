/* eslint-disable react/jsx-props-no-spreading */
import classNames from 'classnames';
import React, { forwardRef, useCallback, useRef, useImperativeHandle } from 'react';
import { ConfigProvider, InputNumber, InputNumberProps, ThemeConfig } from 'antd';

import styles from './UnitInput.module.scss';

interface Props extends InputNumberProps<number> {
  unit?: string;
  isInch?: boolean;
  theme?: ThemeConfig;
  underline?: boolean;
  fireOnChange?: boolean;
  clipValue?: boolean;
}

/**
 * Unit Input by Antd InputNumber
 * using formatter and parser to display unit
 * if isInch is true, the unit will be inch but the value will still be mm,
 * the transfer will be handled by formatter and parser
 */
const UnitInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      unit,
      isInch,
      onBlur,
      onChange,
      theme,
      underline,
      precision = 4,
      fireOnChange = false,
      clipValue = false,
      ...props
    }: Props,
    outerRef
  ): JSX.Element => {
    const inputRef = useRef<HTMLInputElement>(null);
    const valueRef = useRef<number | undefined>(); // for onChange

    useImperativeHandle(
      outerRef,
      () => {
        const input = inputRef.current;
        return input.parentNode?.querySelector('input') || input;
      },
      []
    );

    const formatter = useCallback(
      (value: string | number) => {
        let newVal = typeof value === 'string' ? parseFloat(value) : value;

        if (isInch) {
          newVal /= 25.4;
        }

        return String(Math.round(newVal * 10 ** precision) / 10 ** precision);
      },
      [isInch, precision]
    );

    const parser = useCallback(
      (value: string) => parseFloat(value.trim().replaceAll(',', '.')) * (isInch ? 25.4 : 1),
      [isInch]
    );

    const handleValueChange = useCallback(
      (value: number | undefined) => {
        // Only trigger onChange if the value has changed
        if (value !== valueRef.current && !Number.isNaN(value)) {
          let val = value;
          if (clipValue) {
            if (val > props.max) val = props.max;
            else if (val < props.min) val = props.min;
          }
          valueRef.current = val; // Update the previous value
          onChange?.(val);
        }
      },
      [clipValue, onChange, props.max, props.min]
    );

    const handlePressEnter = useCallback(() => {
      handleValueChange(parser(inputRef.current?.value));
    }, [handleValueChange, parser]);

    const handleBlur = useCallback(
      (e) => {
        handleValueChange(parser(inputRef.current?.value));
        onBlur?.(e);
      },
      [handleValueChange, parser, onBlur]
    );

    const handleStep = useCallback(
      (value: number) => {
        handleValueChange(value);
      },
      [handleValueChange]
    );

    return (
      <div className={classNames(styles.input, { [styles.underline]: underline })}>
        <ConfigProvider theme={theme}>
          <InputNumber
            ref={inputRef}
            onPressEnter={handlePressEnter}
            {...props}
            onBlur={handleBlur}
            onChange={fireOnChange ? onChange : undefined}
            onStep={handleStep}
            formatter={formatter}
            parser={parser}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </ConfigProvider>
      </div>
    );
  }
);

export default UnitInput;
