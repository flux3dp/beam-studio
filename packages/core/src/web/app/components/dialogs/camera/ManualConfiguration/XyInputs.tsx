import React from 'react';

import styles from './ManualConfiguration.module.scss';
import NumberField from './NumberField';

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
  const bound = (b: [number, number] | number | undefined, axis: 0 | 1) => (Array.isArray(b) ? b[axis] : b);

  return (
    <div className={styles.inputs}>
      <NumberField
        disabled={disabled}
        kind="mm"
        label="X"
        max={bound(max, 0)}
        min={bound(min, 0)}
        onChange={(x) => onChange({ ...value, x })}
        value={value.x}
      />
      <NumberField
        disabled={disabled}
        kind="mm"
        label="Y"
        max={bound(max, 1)}
        min={bound(min, 1)}
        onChange={(y) => onChange({ ...value, y })}
        value={value.y}
      />
    </div>
  );
};

export default XyInputs;
