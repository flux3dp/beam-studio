import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

const RightPadding = (props: CommonProps): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="rightPadding"
      id="rightPadding"
      max={200}
      min={0}
      title="Right Padding"
      unit="mm"
      {...props}
    />
  );
};

export default memo(RightPadding);
