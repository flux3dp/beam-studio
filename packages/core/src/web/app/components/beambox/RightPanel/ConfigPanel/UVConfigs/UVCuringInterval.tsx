import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const UVCuringInterval = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="uvCuringInterval"
      id="uvCuringInterval"
      max={100}
      min={0}
      title="UV Curing Interval"
      type={type}
      unit="row"
    />
  );
};

export default memo(UVCuringInterval);
