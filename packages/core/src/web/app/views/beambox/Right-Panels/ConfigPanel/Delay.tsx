import type { ReactNode } from 'react';
import React, { memo } from 'react';

import NumberBlock from './NumberBlock';

const Delay = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  return (
    <NumberBlock
      configKey="delay"
      hasSlider
      id="delay"
      max={20000}
      min={0}
      precision={0}
      step={100}
      title="Laser Delay"
      type={type}
      unit="us"
    />
  );
};

export default memo(Delay);
