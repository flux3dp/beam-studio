import React from 'react';

import { Flex } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from '../Form.module.scss';

import type { ForceTransform } from './layout';

interface ForceTransformFormProps {
  className?: string;
  handleChange: (value: ForceTransform) => void;
  isInch: boolean;
  value: ForceTransform;
}

type Field = keyof ForceTransform;

const AXES = ['X', 'Y', 'Z'] as const;
const LIMITS: Record<Field, { max: number; min: number }> = {
  offset: { max: 1000, min: -1000 },
  scale: { max: 1000, min: 0.01 },
};

export default function ForceTransformForm({
  className,
  handleChange,
  isInch,
  value,
}: ForceTransformFormProps): React.JSX.Element {
  const { material_test_generator: t } = useI18n();
  const lengthUnit = isInch ? 'in' : 'mm';

  const renderInput = (field: Field, axis: number) => (
    <UnitInput
      addonAfter={lengthUnit}
      className={styles.input}
      data-testid={`${field}-${AXES[axis]}`}
      isInch={isInch}
      key={`${field}-${axis}`}
      max={LIMITS[field].max}
      min={LIMITS[field].min}
      onChange={(next) => {
        if (next === null || next === undefined) return;

        const values = [...value[field]] as ForceTransform[Field];

        values[axis] = Math.min(LIMITS[field].max, Math.max(LIMITS[field].min, next));
        handleChange({ ...value, [field]: values });
      }}
      precision={isInch ? 4 : 2}
      step={isInch ? 2.54 : 0.1}
      value={value[field][axis]}
    />
  );

  return (
    <Flex className={className} justify="space-between">
      <Flex gap="8px" justify="space-between" vertical>
        <div className={styles.title}>{t.force_transform}</div>
        <div className={styles.label}>{t.force_scale}</div>
        <div className={styles.label}>{t.force_offset}</div>
      </Flex>

      <Flex className={styles.inputs} gap="20px" justify="flex-end">
        {AXES.map((axis, index) => (
          <Flex gap="8px" justify="space-between" key={axis} vertical>
            <div className={styles['sub-title']}>{axis}</div>
            {renderInput('scale', index)}
            {renderInput('offset', index)}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
