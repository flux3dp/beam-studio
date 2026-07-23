import React, { memo, useMemo } from 'react';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useI18n from '@core/helpers/useI18n';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import NumberBlock from './NumberBlock';

const AirAssistBlock = (props: CommonProps): React.JSX.Element => {
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
      unit="%"
      warning={warning}
      {...props}
    />
  );
};

export default memo(AirAssistBlock);
