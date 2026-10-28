import React, { useMemo } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from './ManualConfiguration.module.scss';

export interface XyInputsProps {
  disabled?: boolean;
  /** mm; shown in inch when the document unit is inch (same rule as ModuleCalibration/OffsetSettings) */
  max?: number;
  min?: number;
  onChange: (value: { x: number; y: number }) => void;
  value: { x: number; y: number };
}

/** One X / Y pair in mm, the unit every tab of Manual Configuration edits */
const XyInputs = ({ disabled, max, min, onChange, value }: XyInputsProps): React.JSX.Element => {
  const isInch = useStorageStore((state) => state.isInch);
  // UnitInput keeps the value in mm and converts the display when isInch; step is in mm (0.254 mm = 0.01 in)
  const { precision, step, unit } = useMemo(
    () => (isInch ? { precision: 3, step: 0.254, unit: 'in' } : { precision: 2, step: 0.1, unit: 'mm' }),
    [isInch],
  );
  const shared = {
    className: styles.input,
    disabled,
    isInch,
    max,
    min,
    precision,
    step,
    unit,
    unitClassName: styles.unit,
  };

  return (
    <div className={styles.inputs}>
      <label>X</label>
      <UnitInput {...shared} onChange={(x) => x !== null && onChange({ ...value, x })} value={value.x} />
      <label>Y</label>
      <UnitInput {...shared} onChange={(y) => y !== null && onChange({ ...value, y })} value={value.y} />
    </div>
  );
};

export default XyInputs;
