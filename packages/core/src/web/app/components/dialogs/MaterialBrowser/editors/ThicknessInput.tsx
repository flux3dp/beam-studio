import React from 'react';

import { InputNumber, Segmented, Space } from 'antd';

import type { ThicknessValue } from '@core/helpers/api/material-catalog/thickness';
import { getThicknessLabel } from '@core/helpers/api/material-catalog/thickness';

import styles from './ThicknessInput.module.scss';

interface ThicknessInputProps {
  onChange: (value: ThicknessValue) => void;
  value: ThicknessValue;
}

/** Unit switch + fraction inputs (denominator in inch mode) with a live formatted preview */
const ThicknessInput = ({ onChange, value }: ThicknessInputProps): React.JSX.Element => {
  const { thicknessDen, thicknessNum, thicknessUnit } = value;
  // InputNumber only rounds to `precision` on blur/enter but reports every keystroke; keep the
  // committed value (and the live preview) integral in inch mode
  const toNum = (num: null | number) => (num == null ? undefined : thicknessUnit === 'inch' ? Math.round(num) : num);

  return (
    <Space align="center">
      <Segmented
        onChange={(unit) => onChange({ ...value, thicknessUnit: unit as 'inch' | 'mm' })}
        options={['mm', 'inch']}
        value={thicknessUnit}
      />
      <InputNumber
        className={styles.number}
        min={0}
        onChange={(num) => onChange({ ...value, thicknessNum: toNum(num) })}
        precision={thicknessUnit === 'inch' ? 0 : undefined}
        step={thicknessUnit === 'inch' ? 1 : 0.1}
        value={thicknessNum}
      />
      {thicknessUnit === 'inch' && (
        <>
          ⁄
          <InputNumber
            className={styles.denominator}
            min={1}
            onChange={(den) => onChange({ ...value, thicknessDen: toNum(den) })}
            placeholder="16"
            precision={0}
            step={1}
            value={thicknessDen}
          />
        </>
      )}
      <span className={styles.preview}>{getThicknessLabel(value) ?? '—'}</span>
    </Space>
  );
};

export default ThicknessInput;
