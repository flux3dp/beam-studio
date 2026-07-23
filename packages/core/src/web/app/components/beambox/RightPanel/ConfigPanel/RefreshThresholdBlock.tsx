import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const RefreshThresholdBlock = (props: CommonProps): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshThreshold"
      id="refreshThreshold"
      max={10000}
      min={0}
      title="Refresh Threshold"
      {...props}
    />
  );
};

export default memo(RefreshThresholdBlock);
