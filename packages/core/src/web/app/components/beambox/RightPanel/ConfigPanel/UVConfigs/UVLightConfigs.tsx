import type { ReactNode } from 'react';
import React, { memo } from 'react';

import isDev from '@core/helpers/is-dev';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import CuringOptions from './CuringOptions';
import RightPadding from './RightPadding';
import UVStrength from './UVStrength';

const UVLightConfigs = memo((props: CommonProps): ReactNode => {
  const isDevMode = isDev();

  if (!isDevMode) return null;

  return (
    <>
      <RightPadding {...props} />
      <UVStrength {...props} />
      <CuringOptions {...props} />
    </>
  );
});

export default UVLightConfigs;
