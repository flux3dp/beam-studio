import React, { useMemo } from 'react';

import { formatter } from '@core/helpers/config/convert';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

type Props = {
  config: NumberOptionConfig;
  hasMultiValue?: boolean;
  isInch?: boolean;
  value: number;
};

const ValueDisplay = ({ config, hasMultiValue = false, isInch, value }: Props): React.JSX.Element => {
  const displayValue = useMemo(
    () => formatter(value, { config, isInch, multiValue: hasMultiValue, withUnit: true }),

    [hasMultiValue, config, value, isInch],
  );

  return (
    <span
      style={{
        color: '#99a1af',
        fontSize: 12,
      }}
    >
      {displayValue}
    </span>
  );
};

export default ValueDisplay;
