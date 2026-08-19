import React from 'react';

import { InputNumber, Segmented, Space } from 'antd';

import type { MaterialVariant } from '@core/interfaces/IMaterial';

import { getThicknessLabel } from '../utils/inchDisplay';

import styles from './ThicknessInput.module.scss';

export interface ThicknessValue {
  thicknessDen?: number;
  thicknessNum?: number;
  thicknessUnit: 'inch' | 'mm';
}

/** Drops the denominator outside inch mode and collapses "no number" to undefined, ready for addVariant */
export const toVariantThickness = (
  value: ThicknessValue,
): Pick<MaterialVariant, 'thicknessDen' | 'thicknessNum' | 'thicknessUnit'> | undefined =>
  value.thicknessNum
    ? {
        thicknessNum: value.thicknessNum,
        thicknessUnit: value.thicknessUnit,
        ...(value.thicknessUnit === 'inch' && value.thicknessDen && { thicknessDen: value.thicknessDen }),
      }
    : undefined;

interface ThicknessInputProps {
  onChange: (value: ThicknessValue) => void;
  value: ThicknessValue;
}

/** Unit switch + fraction inputs (denominator in inch mode) with a live formatted preview */
const ThicknessInput = ({ onChange, value }: ThicknessInputProps): React.JSX.Element => {
  const { thicknessDen, thicknessNum, thicknessUnit } = value;

  return (
    <Space align="center">
      <Segmented
        onChange={(unit) => onChange({ ...value, thicknessUnit: unit as 'inch' | 'mm' })}
        options={['mm', 'inch']}
        value={thicknessUnit}
      />
      <InputNumber
        min={0}
        onChange={(num) => onChange({ ...value, thicknessNum: num ?? undefined })}
        step={thicknessUnit === 'inch' ? 1 : 0.1}
        style={{ width: 80 }}
        value={thicknessNum}
      />
      {thicknessUnit === 'inch' && (
        <>
          ⁄
          <InputNumber
            min={1}
            onChange={(den) => onChange({ ...value, thicknessDen: den ?? undefined })}
            placeholder="16"
            step={1}
            style={{ width: 70 }}
            value={thicknessDen}
          />
        </>
      )}
      <span className={styles.preview}>{getThicknessLabel(value) ?? '—'}</span>
    </Space>
  );
};

export default ThicknessInput;
