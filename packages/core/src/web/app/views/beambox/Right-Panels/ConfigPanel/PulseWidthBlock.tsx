import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const PulseWidthBlock = ({
  max,
  min,
  type = 'default',
}: {
  max: number;
  min: number;
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="pulseWidth"
      id="pulseWidth"
      max={max}
      min={min}
      precision={0}
      title={t.pulse_width}
      type={type}
      unit="ns"
    />
  );
};

export default memo(PulseWidthBlock);
