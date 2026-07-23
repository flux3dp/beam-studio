import React, { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const MinPadding = (props: CommonProps): React.JSX.Element => {
  return (
    <NumberBlock configKey="minPadding" id="minPadding" max={500} min={0} title="Min Padding" unit="mm" {...props} />
  );
};

export default memo(MinPadding);
