import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const UVStrength = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock configKey="uvStrength" id="uvStrength" max={100} min={0} title="UV Strength" type={type} unit="%" />
  );
};

export default memo(UVStrength);
