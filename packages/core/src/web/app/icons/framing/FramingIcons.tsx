import React from 'react';

import type { TFramingType } from '@core/helpers/device/framing';
import { FramingType } from '@core/helpers/device/framing';

import AreaCheck from './areacheck.svg';
import Contour from './contour.svg';
import Framing from './framing.svg';
import Hull from './hull.svg';
import RotateAxis from './rotateAxis.svg';

export const renderFramingIcon = (type: TFramingType, className?: string): React.ReactNode => {
  switch (type) {
    case FramingType.Framing:
    case FramingType.RotateFraming:
      return <Framing className={className} />;
    case FramingType.Hull:
      return <Hull className={className} />;
    case FramingType.AreaCheck:
      return <AreaCheck className={className} />;
    case FramingType.RotateAxis:
      return <RotateAxis className={className} />;
    case FramingType.Contour:
      return <Contour className={className} />;
    default:
      return null;
  }
};

export default {
  AreaCheck,
  Contour,
  Framing,
  Hull,
  RotateAxis,
};
