import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const UVDpi = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return <NumberBlock configKey="uvDpi" id="uv-dpi" max={150} min={50} title="UV DPI" type={type} />;
};

export default memo(UVDpi);
