import type { ReactNode } from 'react';
import React, { memo } from 'react';

import isDev from '@core/helpers/is-dev';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import Interpolation from './Interpolation';
import XStep from './XStep';

const UVPrintingConfigs = memo((props: CommonProps): ReactNode => {
  const isDevMode = isDev();

  if (!isDevMode) return null;

  return (
    <>
      <Interpolation {...props} />
      <XStep {...props} />
    </>
  );
});

export default UVPrintingConfigs;
