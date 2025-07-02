import React, { memo, useEffect, useMemo } from 'react';

import moduleBoundaryDrawer from '@core/app/actions/canvas/module-boundary-drawer';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const RepeatBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { repeat } = useConfigPanelStore();
  const isZero = useMemo(() => repeat.value === 0, [repeat.value]);

  useEffect(() => {
    moduleBoundaryDrawer.update({ unionOnly: true });
  }, [isZero]);

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
