import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const PulseWidthBlock = ({ max, min, ...props }: CommonProps & { max: number; min: number }): React.JSX.Element => {
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
      unit="ns"
      {...props}
    />
  );
};

export default memo(PulseWidthBlock);
