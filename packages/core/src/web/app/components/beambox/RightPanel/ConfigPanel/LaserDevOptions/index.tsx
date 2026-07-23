import { memo } from 'react';

import isDev from '@core/helpers/is-dev';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

import OneWayEngraving from './OneWayEngraving';

const LaserDevOptions = (props: CommonProps) => {
  if (!isDev()) return null;

  return (
    <>
      <OneWayEngraving {...props} />
      <NumberBlock
        configKey="travelSpeed"
        hasSlider
        id="travel-speed"
        max={4000}
        min={0}
        precision={0}
        title="Travel Speed"
        unit="mm/s"
        {...props}
      />
      <NumberBlock
        configKey="accX"
        hasSlider
        id="acc-x"
        max={50000}
        min={0}
        precision={0}
        title="Acc X"
        unit="mm/s²"
        {...props}
      />
      <NumberBlock
        configKey="accY"
        hasSlider
        id="acc-y"
        max={50000}
        min={0}
        precision={0}
        title="Acc Y"
        unit="mm/s²"
        {...props}
      />
    </>
  );
};

export default memo(LaserDevOptions);
