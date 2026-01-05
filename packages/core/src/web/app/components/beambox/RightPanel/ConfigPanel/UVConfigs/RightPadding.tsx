import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const RightPadding = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="rightPadding"
      id="rightPadding"
      max={200}
      min={0}
      title="Right Padding"
      type={type}
      unit="mm"
    />
  );
};

export default memo(RightPadding);
