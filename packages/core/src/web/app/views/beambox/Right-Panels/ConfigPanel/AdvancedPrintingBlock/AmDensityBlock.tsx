import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const AMDensityBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="amDensity"
      id="am-density"
      max={10}
      min={0.1}
      precision={1}
      title="AM Density"
      type={type}
    />
  );
};

export default memo(AMDensityBlock);
