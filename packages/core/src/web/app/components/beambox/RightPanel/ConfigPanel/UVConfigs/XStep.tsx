import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const XStep = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return <NumberBlock configKey="uvXStep" id="uvXStep" max={10} min={1} title="UV X Step" type={type} />;
};

export default memo(XStep);
