import React, { memo, useMemo } from 'react';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const RepeatBlock = (props: CommonProps): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const max = useMemo(() => {
    return getWorkarea(workarea).maxRepeat || 100;
  }, [workarea]);

  return <NumberBlock configKey="repeat" id="repeat" max={max} min={0} title={t.repeat} unit={t.times} {...props} />;
};

export default memo(RepeatBlock);
