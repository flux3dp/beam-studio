import { match } from 'ts-pattern';

import type { WorkAreaModel } from './workarea-constants';

export const getWarningSpeed = (workarea: WorkAreaModel, maxAngle: number): null | number => {
  return match(workarea)
    .with('fbm2', () => {
      if (maxAngle >= 45) return 20;

      if (maxAngle >= 35) return 40;

      if (maxAngle >= 25) return 70;

      if (maxAngle >= 15) return 80;

      return 90;
    })
    .otherwise(() => null);
};
