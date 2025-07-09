import React, { memo, useMemo } from 'react';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useI18n from '@core/helpers/useI18n';

import NumberBlock from './NumberBlock';

const AirAssistBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { airAssist } = useConfigPanelStore();
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();
  const warning = useMemo(() => {
    if (airAssist.value < 50) {
      return t.low_air_assist_warning;
    }
  }, [airAssist.value, t]);

  return (
    <NumberBlock
      configKey="airAssist"
      id="air-assist"
      max={100}
      min={0}
      precision={0}
      title={t.air_assist}
      type={type}
      unit="%"
      warning={warning}
    />
  );
};

export default memo(AirAssistBlock);
