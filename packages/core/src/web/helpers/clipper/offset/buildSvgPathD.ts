import { simplifyPathPoints } from '@core/helpers/path/simplifyPath';

import { ROUND_FACTOR, SCALE_FACTOR } from './constants';

export const buildSvgPathD = (scaledPaths: Array<Array<{ X: number; Y: number }>>, simplify: boolean): string =>
  scaledPaths
    .map((path) => {
      if (!path || path.length === 0) return '';

      const scaledPoints = path.map(({ X, Y }) => ({ x: X / SCALE_FACTOR, y: Y / SCALE_FACTOR }));

      if (!simplify) {
        return `M${scaledPoints.map(({ x, y }) => `${x},${y}`).join(' L')}Z`;
      }

      return simplifyPathPoints(scaledPoints, ROUND_FACTOR);
    })
    .join(' ')
    .trim();
