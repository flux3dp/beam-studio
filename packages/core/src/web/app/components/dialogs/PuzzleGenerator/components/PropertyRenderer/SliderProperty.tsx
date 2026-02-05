import React from 'react';

import { Slider } from 'antd';

import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';

import type { NumberPropertyDef } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';

const SliderProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<NumberPropertyDef>): React.JSX.Element => {
  const isInch = useStorageStore((s) => s.isInch);
  const value = (getValue(property.key) as number) ?? property.default;

  const isMmProperty = property.unit === 'mm';
  const step = property.step ?? 1;
  const inchStep = isMmProperty && isInch ? 0.254 : step;
  const precision = isMmProperty && isInch ? 4 : Math.max(0, Math.ceil(-Math.log10(step)));
  const displayUnit = isMmProperty ? (isInch ? 'in' : 'mm') : property.unit;

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>{getLabel(property.labelKey)}</div>
      <div className={styles['property-control']}>
        <Slider
          className={styles.slider}
          max={property.max}
          min={property.min}
          onChange={(val) => setValue(property.key, val)}
          step={step}
          tooltip={{ open: false }}
          value={value}
        />
        <UnitInput
          className={styles['number-input']}
          controls={false}
          isInch={isMmProperty ? isInch : undefined}
          max={property.max}
          min={property.min}
          onChange={(val) => val !== undefined && setValue(property.key, val)}
          precision={precision}
          step={inchStep}
          unit={displayUnit}
          value={value}
        />
      </div>
    </div>
  );
};

export default SliderProperty;
