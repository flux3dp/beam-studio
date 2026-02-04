import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const AMDensityBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
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
      type={type}
    />
  );
};

export default memo(AMDensityBlock);
