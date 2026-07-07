import React, { memo } from 'react';

import NumberBlock from './NumberBlock';

const MinPadding = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock configKey="minPadding" id="minPadding" max={500} min={0} title="Min Padding" type={type} unit="mm" />
  );
};

export default memo(MinPadding);
