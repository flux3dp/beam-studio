import type { ReactNode } from 'react';
import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

interface FillIntervalBlockProps {
  type?: 'default' | 'modal' | 'panel-item';
}

const FillIntervalBlock = ({ type = 'default' }: FillIntervalBlockProps): ReactNode => {
  const t = useI18n().beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="fillInterval"
      forceUsePropsUnit
      id="fillInterval"
      max={100}
      min={0.0001}
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
