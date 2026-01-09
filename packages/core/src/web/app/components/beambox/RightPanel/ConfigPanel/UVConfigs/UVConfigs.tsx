import type { ReactNode } from 'react';
import React, { memo } from 'react';

import isDev from '@core/helpers/is-dev';

import CuringOptions from './CuringOptions';
import Interpolation from './Interpolation';
import RightPadding from './RightPadding';
import UVStrength from './UVStrength';
import XStep from './XStep';

const UVConfigs = memo(({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): ReactNode => {
  const isDevMode = isDev();

  if (!isDevMode) return null;

  return (
    <>
      <Interpolation type={type} />
      <RightPadding type={type} />
      <XStep type={type} />
      <UVStrength type={type} />
      <CuringOptions type={type} />
    </>
  );
});

export default UVConfigs;
