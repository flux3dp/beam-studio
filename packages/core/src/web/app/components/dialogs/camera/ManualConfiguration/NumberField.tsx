import React from 'react';

import { match } from 'ts-pattern';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from './ManualConfiguration.module.scss';

/** mm follows the document unit (display only, the value stays mm); deg and ratio are unit-less to the document */
export type FieldKind = 'deg' | 'mm' | 'ratio';

export interface NumberFieldProps {
  disabled?: boolean;
  kind: FieldKind;
  label: React.ReactNode;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}

/** One labelled number of Manual Configuration: 100px, no steppers, laid out by the enclosing `.inputs` */
const NumberField = ({ disabled, kind, label, max, min, onChange, value }: NumberFieldProps): React.JSX.Element => {
  const isInch = useStorageStore((state) => state.isInch);
  const unitProps = match(kind)
    .with('mm', () =>
      // UnitInput converts the display when isInch; step is in mm (0.254 mm = 0.01 in)
      isInch
        ? { isInch: true, precision: 3, step: 0.254, unit: 'in' }
        : { isInch: false, precision: 2, step: 0.1, unit: 'mm' },
    )
    .with('deg', () => ({ isInch: false, precision: 2, step: 0.1, unit: '°' }))
    .with('ratio', () => ({ isInch: false, precision: 4, step: 0.01, unit: '' }))
    .exhaustive();

  return (
    <label className={styles.pair}>
      {label}
      <UnitInput
        {...unitProps}
        className={styles.input}
        controls={false}
        disabled={disabled}
        max={max}
        min={min}
        onChange={(next) => next !== null && onChange(next)}
        unitClassName={styles.unit}
        value={value}
      />
    </label>
  );
};

export default NumberField;
