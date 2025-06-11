import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const WhiteInkY = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="uvIntervalY"
      id="white-ink-y-interval"
      max={5}
      min={0.01}
      precision={2}
      title="Y Interval"
      type={type}
      unit="mm"
    />
  );
};

export default memo(WhiteInkY);
