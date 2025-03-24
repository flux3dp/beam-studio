import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const RefreshWidthBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="refreshWidth"
      id="refresh-width"
      max={5}
      min={0}
      precision={1}
      title="Refresh Width"
      type={type}
      unit="mm"
    />
  );
};

export default memo(RefreshWidthBlock);
