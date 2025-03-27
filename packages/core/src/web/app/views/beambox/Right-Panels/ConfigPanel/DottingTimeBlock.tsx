import type { ReactNode } from 'react';
import React, { memo, useContext } from 'react';

import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const DottingTimeBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const lang = useI18n();
  const { hasGradient } = useContext(LayerPanelContext);

  if (!hasGradient) return null;

  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="dottingTime"
      id="dottingTime"
      max={10000}
      min={1}
      precision={0}
      title={t.dottingTime}
      tooltip={t.gradient_only}
      type={type}
      unit="us"
    />
  );
};

export default memo(DottingTimeBlock);
