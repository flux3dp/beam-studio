import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';
import usePromarkLimit from './usePromarkLimit';

const QPulseWidthBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { qPulseWidth: limit } = usePromarkLimit();

  if (!limit) return null;

  return (
    <NumberBlock
      configKey="qPulseWidth"
      id="qPulseWidth"
      max={limit.max}
      min={limit.min}
      precision={4}
      title={t.q_pulse_width}
      type={type}
      unit="us"
    />
  );
};

export default memo(QPulseWidthBlock);
