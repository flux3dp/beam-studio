import React, { memo, useMemo } from 'react';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const RepeatBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const max = useMemo(() => {
    return getWorkarea(workarea).maxRepeat || 100;
  }, [workarea]);

  return (
    <NumberBlock
      configKey="repeat"
      id="repeat"
      max={max}
      min={0}
      panelType="button"
      title={t.repeat}
      type={type}
      unit={t.times}
    />
  );
};

export default memo(RepeatBlock);
