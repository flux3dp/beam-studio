import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './ManualConfiguration.module.scss';
import { type RegionOffsets, REGIONS } from './offsetParams';
import XyInputs from './XyInputs';

export interface RegionOffsetGridProps {
  disabled?: boolean;
  max?: number;
  min?: number;
  onChange: (value: RegionOffsets) => void;
  value: RegionOffsets;
}

/** Nine X / Y pairs, one per `WideAngleRegion`, in a 3×3 grid that mirrors the bed */
const RegionOffsetGrid = ({ disabled, max, min, onChange, value }: RegionOffsetGridProps): React.JSX.Element => {
  const t = useI18n().manual_config.region;

  return (
    <div className={styles.regions}>
      {REGIONS.map((region) => (
        <div key={region}>
          <div className={styles.label}>{t[region]}</div>
          <XyInputs
            disabled={disabled}
            max={max}
            min={min}
            onChange={({ x, y }) => onChange({ ...value, [region]: [x, y] })}
            value={{ x: value[region][0], y: value[region][1] }}
          />
        </div>
      ))}
    </div>
  );
};

export default RegionOffsetGrid;
