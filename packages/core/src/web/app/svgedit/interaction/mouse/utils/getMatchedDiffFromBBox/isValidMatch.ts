import { match } from 'ts-pattern';

import type { IPoint } from '@core/interfaces/ISVGCanvas';

// matrix
// 0 1 2
// 3   4
// 5 6 7

export function isValidMatch(matchPoint: IPoint, center: IPoint, index: number, by: 'x' | 'y') {
  return match(by)
    .with('x', () => {
      if (!matchPoint?.x) return false;

      if ([3, 4].includes(index)) return false;

      if (index < 3 && matchPoint.y > center.y) return false;

      if (index > 4 && matchPoint.y < center.y) return false;

      return true;
    })
    .with('y', () => {
      if (!matchPoint?.y) return false;

      if ([1, 6].includes(index)) return false;

      if ([0, 3, 5].includes(index) && matchPoint.x > center.x) return false;

      if ([2, 4, 7].includes(index) && matchPoint.x < center.x) return false;

      return true;
    })
    .otherwise(() => false);
}
