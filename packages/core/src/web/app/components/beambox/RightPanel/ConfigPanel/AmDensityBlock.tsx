import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const AMDensityBlock = (props: CommonProps): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();

  return (
    <NumberBlock
      configKey="amDensity"
      id="am-density"
      max={10}
      min={0.1}
      precision={1}
      title={t.am_density}
      {...props}
    />
  );
};

export default memo(AMDensityBlock);
