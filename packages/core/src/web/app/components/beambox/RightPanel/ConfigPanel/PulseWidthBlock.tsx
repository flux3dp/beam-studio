import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';
import usePromarkLimit from './usePromarkLimit';

interface Props {
  type?: 'default' | 'modal' | 'panel-item';
}

const PulseWidthBlock = ({ type = 'default' }: Props): React.ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { pulseWidth: limit } = usePromarkLimit();

  if (!limit) return null;

  return (
    <NumberBlock
      configKey="pulseWidth"
      id="pulseWidth"
      max={limit.max}
      min={limit.min}
      precision={0}
      title={t.pulse_width}
      type={type}
      unit="ns"
    />
  );
};

export default memo(PulseWidthBlock);
