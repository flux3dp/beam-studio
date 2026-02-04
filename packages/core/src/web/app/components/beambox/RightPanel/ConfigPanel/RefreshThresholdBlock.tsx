import React, { memo } from 'react';

import NumberBlock from './NumberBlock';

const RefreshThresholdBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshThreshold"
      id="refreshThreshold"
      max={10000}
      min={0}
      panelType="button"
      title="Refresh Threshold"
      type={type}
    />
  );
};

export default memo(RefreshThresholdBlock);
