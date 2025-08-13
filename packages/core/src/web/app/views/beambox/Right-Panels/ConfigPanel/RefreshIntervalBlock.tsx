import React, { memo } from 'react';

import NumberBlock from './NumberBlock';

const RefreshIntervalBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshInterval"
      id="refreshInterval"
      min={0}
      panelType="button"
      title="Refresh per"
      type={type}
      unit="rows"
    />
  );
};

export default memo(RefreshIntervalBlock);
