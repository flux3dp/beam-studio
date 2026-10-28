import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import { useInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const DottingTimeBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const lang = useI18n();
  const hasGradient = useLayerStore((state) => state.hasGradient);
  // ConfigPanel decides by the layer's mode whether it shows at all (getInnerEngravingBlocks)
  const isInnerEngraving = useInnerEngravingActive();
  // In inner engraving dot mode every dot uses it, so "for gradient images only" does not hold. In
  // line mode it still only applies to the images, which are dotted
  const isDotMode = useConfigPanelStore(
    (state) => isInnerEngraving && state.stlMode?.value !== 'line' && !state.stlMode?.hasMultiValue,
  );

  if (!hasGradient && !isInnerEngraving) return null;

  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="dottingTime"
      id="dottingTime"
      max={10000}
      min={1}
      precision={0}
      title={t.dottingTime}
      tooltip={isDotMode ? undefined : t.gradient_only}
      type={type}
      unit="us"
    />
  );
};

export default memo(DottingTimeBlock);
