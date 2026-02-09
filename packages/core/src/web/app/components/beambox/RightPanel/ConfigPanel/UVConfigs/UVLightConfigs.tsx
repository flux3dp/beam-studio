import type { ReactNode } from 'react';
import React, { memo } from 'react';

import isDev from '@core/helpers/is-dev';

import CuringOptions from './CuringOptions';
import RightPadding from './RightPadding';
import UVStrength from './UVStrength';

const UVLightConfigs = memo(({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const isDevMode = isDev();

  if (!isDevMode) return null;

  return (
    <>
      <RightPadding type={type} />
      <UVStrength type={type} />
      <CuringOptions type={type} />
    </>
  );
});

export default UVLightConfigs;
