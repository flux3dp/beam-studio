import { memo } from 'react';

import NumberBlock from '../NumberBlock';

const NozzleOffset = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  return (
    <>
      <NumberBlock
        configKey="nozzleOffsetX"
        id="nozzle-offset-x"
        max={5}
        min={-5}
        precision={5}
        title="Nozzle Offset X"
        type={type}
        unit="mm"
      />
      <NumberBlock
        configKey="nozzleOffsetY"
        id="nozzle-offset-y"
        max={5}
        min={-5}
        precision={5}
        title="Nozzle Offset Y"
        type={type}
        unit="mm"
      />
    </>
  );
};

export default memo(NozzleOffset);
