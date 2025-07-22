import React, { memo } from 'react';

import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const RepeatBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <NumberBlock
      configKey="repeat"
      id="repeat"
      max={100}
      min={0}
      panelType="button"
      title={t.repeat}
      type={type}
      unit={t.times}
    />
  );
};

export default memo(RepeatBlock);
