import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { UndoOutlined } from '@ant-design/icons';
import { Slider } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './SliderControl.module.scss';

interface SliderControlProps {
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit: string;
  value: number;
}

const SliderControl = ({
  defaultValue,
  label,
  max,
  min,
  onChange,
  step,
  unit,
  value,
}: SliderControlProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const isModified = value !== defaultValue;
  const precision = Math.max(0, Math.ceil(-Math.log10(step)));

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
            addonAfter={unit}
            className={styles.input}
            max={max}
            min={min}
            onChange={(val) => val !== null && onChange(val)}
            precision={precision}
            step={step}
            value={value}
          />
        </div>
      </div>
      <Slider max={max} min={min} onChange={onChange} step={step} tooltip={{ open: false }} value={value} />
    </div>
  );
};

SliderControl.displayName = 'SliderControl';

export default memo(SliderControl);
