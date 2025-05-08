import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const WhiteInkX = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="whiteInkX"
      id="white-ink-x-interval"
      max={5}
      min={0.01}
      precision={2}
      title="X Interval"
      type={type}
      unit="mm"
    />
  );
};

export default memo(WhiteInkX);
