import React, { memo } from 'react';

import NumberBlock from '../NumberBlock';

const PrintingRepeat = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  return (
    <NumberBlock
      configKey="uvPrintingRepeat"
      id="uvPrintingRepeat"
      max={100}
      min={1}
      title="UV Printing Repeat"
      type={type}
    />
  );
};

export default memo(PrintingRepeat);
