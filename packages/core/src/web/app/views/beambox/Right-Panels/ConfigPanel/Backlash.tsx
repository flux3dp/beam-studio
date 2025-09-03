import type { ReactNode } from 'react';
import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const Backlash = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="backlash"
      hasSlider
      id="backlash"
      max={10}
      min={-10}
      precision={2}
      step={0.1}
      title={t.backlash}
      type={type}
      unit="mm"
    />
  );
};

export default memo(Backlash);
