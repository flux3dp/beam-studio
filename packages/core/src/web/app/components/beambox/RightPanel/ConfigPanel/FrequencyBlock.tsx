import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';
import usePromarkLimit from './usePromarkLimit';

interface Props {
  type?: 'default' | 'modal' | 'panel-item';
}

const FrequencyBlock = ({ type = 'default' }: Props): React.ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { frequency: limit } = usePromarkLimit();

  if (!limit) return null;

  return (
    <NumberBlock
      configKey="frequency"
      id="frequency"
      max={limit.max}
      min={limit.min}
      precision={0}
      title={t.frequency}
      type={type}
      unit="kHz"
    />
  );
};

export default memo(FrequencyBlock);
