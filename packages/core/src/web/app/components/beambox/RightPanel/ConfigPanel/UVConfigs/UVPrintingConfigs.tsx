import type { ReactNode } from 'react';
import React, { memo } from 'react';

import isDev from '@core/helpers/is-dev';

import Interpolation from './Interpolation';
import XStep from './XStep';

const UVPrintingConfigs = memo(({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const isDevMode = isDev();

  if (!isDevMode) return null;

  return (
    <>
      <Interpolation type={type} />
      <XStep type={type} />
    </>
  );
});

export default UVPrintingConfigs;
