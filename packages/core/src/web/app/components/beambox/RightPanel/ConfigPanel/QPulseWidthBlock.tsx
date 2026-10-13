import React, { memo } from 'react';

import { mockT } from '@core/helpers/is-dev';

import NumberBlock from './NumberBlock';
import usePromarkLimit from './usePromarkLimit';

const QPulseWidthBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  const { qPulseWidth: limit } = usePromarkLimit();

  if (!limit) return null;

  return (
    <NumberBlock
      configKey="qPulseWidth"
      id="qPulseWidth"
      max={limit.max}
      min={limit.min}
      precision={4}
      // to be translated; the material test labels it the same way (TableSettingForm)
      title={mockT('Q 開關')}
      type={type}
      unit="us"
    />
  );
};

export default memo(QPulseWidthBlock);
