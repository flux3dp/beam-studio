import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';

import { UndoOutlined } from '@ant-design/icons';
import { Slider } from 'antd';
import classNames from 'classnames';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './Base.module.scss';

interface NumberControlProps {
  /** Renders the label with the group-title weight — used when the control stands alone (no group). */
  boldLabel?: boolean;
  defaultValue?: number;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  /** Upper bound for the slider only. Defaults to `max` (shared with the input). */
  sliderMax?: number;
  /** Lower bound for the slider only. Defaults to `min` (shared with the input). */
  sliderMin?: number;
  step: number;
  unit: string;
  value: number;
  withSlider?: boolean;
}

const NumberControl = ({
  boldLabel = false,
  defaultValue,
  label,
  max,
  min,
  onChange,
  sliderMax,
  sliderMin,
  step: propStep,
  unit,
  value,
  withSlider = true,
}: NumberControlProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const isModified = defaultValue !== undefined && value !== defaultValue;
  const isInch = useStorageStore((state) => state.isInch);
  const displayInch = useMemo(() => isInch && unit === 'mm', [isInch, unit]);
  const displayUnit = useMemo(() => (displayInch ? 'in' : unit), [displayInch, unit]);
  const step = useMemo(() => (displayInch ? propStep * 2.54 : propStep), [propStep, displayInch]);
  const precision = useMemo(
    () => Math.max(0, Math.ceil(-Math.log10(displayInch ? step / 25.4 : step))),
    [step, displayInch],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={classNames(styles.label, { [styles.bold]: boldLabel })}>{label}</div>
        <div className={styles['input-group']}>
          {isModified && (
            <button
              className={styles['reset-button']}
              onClick={() => onChange(defaultValue)}
              title={t.reset_to_default}
              type="button"
            >
              <UndoOutlined />
            </button>
          )}
          <UnitInput
            addonAfter={displayUnit}
            className={styles.input}
            isInch={displayInch}
            max={max}
            min={min}
            onChange={(val) => val !== null && onChange(val)}
            precision={precision}
            step={step}
            value={value}
          />
        </div>
      </div>
      {withSlider && (
        <Slider
          className={styles.slider}
          max={sliderMax ?? max}
          min={sliderMin ?? min}
          onChange={onChange}
          step={step}
          tooltip={{ open: false }}
          value={value}
        />
      )}
    </div>
  );
};

NumberControl.displayName = 'NumberControl';

export default memo(NumberControl);
