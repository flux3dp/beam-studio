import { memo } from 'react';

import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from '../NumberBlock';

const NozzleOffset = (props: CommonProps) => {
  return (
    <>
      <NumberBlock
        configKey="nozzleOffsetX"
        id="nozzle-offset-x"
        max={5}
        min={-5}
        precision={5}
        title="Nozzle Offset X"
        unit="mm"
        {...props}
      />
      <NumberBlock
        configKey="nozzleOffsetY"
        id="nozzle-offset-y"
        max={5}
        min={-5}
        precision={5}
        title="Nozzle Offset Y"
        unit="mm"
        {...props}
      />
    </>
  );
};

export default memo(NozzleOffset);
