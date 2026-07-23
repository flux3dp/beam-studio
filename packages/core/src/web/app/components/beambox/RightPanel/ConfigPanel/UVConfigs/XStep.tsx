import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

const XStep = (props: CommonProps): React.JSX.Element => {
  return <NumberBlock configKey="uvXStep" id="uvXStep" max={10} min={1} title="UV X Step" {...props} />;
};

export default memo(XStep);
