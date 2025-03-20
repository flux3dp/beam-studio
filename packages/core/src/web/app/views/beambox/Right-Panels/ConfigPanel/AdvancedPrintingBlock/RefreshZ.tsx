import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const RefreshZBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshZ"
      id="refresh-z"
      max={10}
      min={0}
      precision={1}
      title="Refresh Z"
      type={type}
      unit="mm"
    />
  );
};

export default memo(RefreshZBlock);
