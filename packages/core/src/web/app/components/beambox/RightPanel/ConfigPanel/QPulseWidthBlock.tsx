import React, { memo } from 'react';

import { mockT } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';
import usePromarkLimit from './usePromarkLimit';

const QPulseWidthBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { qPulseWidth: limit } = usePromarkLimit();

  if (!limit) return null;

  return (
    <NumberBlock
      configKey="qPulseWidth"
      id="qPulseWidth"
      max={limit.max}
      min={limit.min}
      precision={4}
      // Note: this i18n key should be handled properly in material test. Check TableSettingForm
      title={mockT(`Q ${t.pulse_width}`)}
      type={type}
      unit="us"
    />
  );
};

export default memo(QPulseWidthBlock);
