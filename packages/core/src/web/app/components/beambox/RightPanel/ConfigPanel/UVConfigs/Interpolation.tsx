import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

const Interpolation = (props: CommonProps): React.JSX.Element => {
  return <NumberBlock configKey="interpolation" id="interpolation" max={5} min={1} title="Interpolation" {...props} />;
};

export default memo(Interpolation);
