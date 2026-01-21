import React from 'react';

import classNames from 'classnames';

import type { UnitInputProps } from '@core/app/widgets/UnitInput';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from '../styles/shared.module.scss';

export type SettingUnitInputProps = Omit<UnitInputProps, 'controls' | 'onChange' | 'unitClassName'> & {
  onChange?: (value: number) => void;
};

const SettingUnitInput = ({ containerClassName, onChange, ...props }: SettingUnitInputProps) => {
  return (
    <UnitInput
      {...props}
      containerClassName={classNames(containerClassName, styles['input-number'])}
      controls={false}
      onChange={(val) => {
        if (val !== null) {
          onChange?.(val);
        }
      }}
      unitClassName={styles.unit}
    />
  );
};

export default SettingUnitInput;
