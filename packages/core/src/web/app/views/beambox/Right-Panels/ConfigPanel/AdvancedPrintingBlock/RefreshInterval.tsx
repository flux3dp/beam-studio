import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const RefreshIntervalBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshInterval"
      id="refresh-interval"
      max={50}
      min={0}
      title="Refresh Interval"
      type={type}
    />
  );
};

export default memo(RefreshIntervalBlock);
