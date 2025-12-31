import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const Interpolation = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return <NumberBlock configKey="interpolation" id="interpolation" max={5} min={1} title="Interpolation" type={type} />;
};

export default memo(Interpolation);
