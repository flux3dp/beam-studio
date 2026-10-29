import React, { useMemo } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from './ManualConfiguration.module.scss';

export interface XyInputsProps {
  disabled?: boolean;
  /** mm; a number applies to both axes, a pair is [x, y] */
  max?: [number, number] | number;
  min?: [number, number] | number;
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
    controls: false,
    disabled,
    isInch,
    precision,
    step,
    unit,
    unitClassName: styles.unit,
  };
  const bound = (b: [number, number] | number | undefined, axis: 0 | 1) => (Array.isArray(b) ? b[axis] : b);

  return (
    <div className={styles.inputs}>
      <label className={styles.pair}>
        X
        <UnitInput
          {...shared}
          max={bound(max, 0)}
          min={bound(min, 0)}
          onChange={(x) => x !== null && onChange({ ...value, x })}
          value={value.x}
        />
      </label>
      <label className={styles.pair}>
        Y
        <UnitInput
          {...shared}
          max={bound(max, 1)}
          min={bound(min, 1)}
          onChange={(y) => y !== null && onChange({ ...value, y })}
          value={value.y}
        />
      </label>
    </div>
  );
};

export default XyInputs;
