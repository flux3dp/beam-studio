import type { ReactNode } from 'react';
import React, { memo } from 'react';

import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

interface FillIntervalBlockProps {
  type?: 'default' | 'modal' | 'panel-item';
}

const FillIntervalBlock = ({ type = 'default' }: FillIntervalBlockProps): ReactNode => {
  const isBeamGo = useWorkarea() === 'fbg1';
  const t = useI18n().beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="fillInterval"
      forceUsePropsUnit
      id="fillInterval"
      max={isBeamGo ? 1 : 100}
      min={isBeamGo ? 0.05 : 0.0001}
      precision={4}
      step={0.0001}
      title={t.fill_interval}
      tooltip={t.filled_path_only}
      type={type}
      unit="mm"
    />
  );
};

export default memo(FillIntervalBlock);
