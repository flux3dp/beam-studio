import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const FrequencyBlock = ({
  max,
  min,
  type = 'default',
}: {
  max: number;
  min: number;
  type?: 'default' | 'modal' | 'panel-item';
}): React.ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="frequency"
      id="frequency"
      max={max}
      min={min}
      precision={0}
      title={t.frequency}
      type={type}
      unit="kHz"
    />
  );
};

export default memo(FrequencyBlock);
