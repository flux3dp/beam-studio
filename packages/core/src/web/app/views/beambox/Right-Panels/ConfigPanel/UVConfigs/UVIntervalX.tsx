import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const UVIntervalX = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="uvIntervalX"
      id="uv-x-interval"
      max={5}
      min={0.01}
      precision={2}
      title="X Interval"
      type={type}
      unit="mm"
    />
  );
};

export default memo(UVIntervalX);
