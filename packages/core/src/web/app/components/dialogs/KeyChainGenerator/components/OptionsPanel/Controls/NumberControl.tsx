import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';

import { UndoOutlined } from '@ant-design/icons';
import { Slider } from 'antd';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './Base.module.scss';

interface NumberControlProps {
  defaultValue?: number;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit: string;
  value: number;
  withSlider?: boolean;
}

const NumberControl = ({
  defaultValue,
  label,
  max,
  min,
  onChange,
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
        <div className={styles.label}>{label}</div>
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
            isInch={displayUnit === 'in'}
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
          max={max}
          min={min}
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
