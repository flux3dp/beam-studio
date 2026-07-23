import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

const UVStrength = (props: CommonProps): React.JSX.Element => {
  return (
    <NumberBlock configKey="uvStrength" id="uvStrength" max={100} min={0} title="UV Strength" unit="%" {...props} />
  );
};

export default memo(UVStrength);
