import { memo } from 'react';

import isDev from '@core/helpers/is-dev';

import NumberBlock from '../NumberBlock';

import OneWayEngraving from './OneWayEngraving';

const LaserDevOptions = () => {
  if (!isDev()) return null;

  return (
    <>
      <OneWayEngraving />
      <NumberBlock configKey="accX" hasSlider id="acc-x" max={50000} min={0} precision={0} title="Acc X" unit="mm/s²" />
      <NumberBlock configKey="accY" hasSlider id="acc-y" max={50000} min={0} precision={0} title="Acc Y" unit="mm/s²" />
    </>
  );
};

export default memo(LaserDevOptions);
