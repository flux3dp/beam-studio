import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const FrequencyBlock = ({ max, min, ...props }: CommonProps & { max: number; min: number }): React.ReactNode => {
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
      unit="kHz"
      {...props}
    />
  );
};

export default memo(FrequencyBlock);
