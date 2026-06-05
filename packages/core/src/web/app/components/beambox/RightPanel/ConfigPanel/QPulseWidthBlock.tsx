import React, { memo } from 'react';

import { mockT } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const QPulseWidthBlock = ({
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
      configKey="qPulseWidth"
      id="qPulseWidth"
      max={max}
      min={min}
      precision={4}
      title={mockT(`Q ${t.pulse_width}`)}
      type={type}
      unit="us"
    />
  );
};

export default memo(QPulseWidthBlock);
