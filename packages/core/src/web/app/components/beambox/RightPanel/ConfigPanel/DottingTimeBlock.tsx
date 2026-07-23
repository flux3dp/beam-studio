import type { ReactNode } from 'react';
import React, { memo } from 'react';

import useLayerStore from '@core/app/stores/layer/layerStore';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const DottingTimeBlock = (props: CommonProps): ReactNode => {
  const lang = useI18n();
  const hasGradient = useLayerStore((state) => state.hasGradient);

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
      unit="us"
      {...props}
    />
  );
};

export default memo(DottingTimeBlock);
