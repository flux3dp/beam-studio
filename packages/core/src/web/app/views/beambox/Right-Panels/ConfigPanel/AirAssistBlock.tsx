import React, { memo, useMemo } from 'react';

import { useConfigPanelStore } from '@core/app/stores/configPanel';

import NumberBlock from './NumberBlock';

const AirAssistBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { airAssist, power } = useConfigPanelStore();
  const warning = useMemo(() => {
    if (power.value > 25 && airAssist.value < 15) {
      return 'Air Assist is recommended to be at least 15% when power is above 25%.';
    }
  }, [power.value, airAssist.value]);

  return (
    <NumberBlock
      configKey="airAssist"
      id="air-assist"
      max={100}
      min={0}
      precision={0}
      title="Air Assist"
      type={type}
      unit="%"
      warning={warning}
    />
  );
};

export default memo(AirAssistBlock);
