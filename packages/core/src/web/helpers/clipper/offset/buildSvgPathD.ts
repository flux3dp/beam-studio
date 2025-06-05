import { fitPath } from '@core/helpers/bezier-fit-curve';

import { ROUND_FACTOR, SCALE_FACTOR } from './constants';

export const buildSvgPathD = (scaledPaths: Array<Array<{ X: number; Y: number }>>, simplify: boolean): string =>
  scaledPaths
    .map((path) => {
      if (!path || path.length === 0) return '';

      let pathData = 'M';
      const scaledPoints = path.map(({ X, Y }) => ({ x: X / SCALE_FACTOR, y: Y / SCALE_FACTOR }));

      if (!simplify) {
        pathData += scaledPoints.map(({ x, y }) => `${x},${y}`).join(' L');

        return pathData + 'Z';
      }

      const pointsToFit = scaledPoints.map(({ x, y }) => ({
        x: Math.round(x * ROUND_FACTOR) / ROUND_FACTOR,
        y: Math.round(y * ROUND_FACTOR) / ROUND_FACTOR,
      }));
      const segments = fitPath(pointsToFit);

      if (segments.length === 0 && pointsToFit.length > 0) {
        // Fallback: if fitPath yields no segments, draw straight lines
        pathData += `${pointsToFit[0].x},${pointsToFit[0].y}`;
        pathData += pointsToFit
          .slice(1)
          .map(({ x, y }) => `L${x},${y}`)
          .join('');
      } else {
        pathData += `${segments[0].points[0].x},${segments[0].points[0].y}`;
        segments.forEach((segment) => {
          const pointsString = segment.points
            .slice(1)
            .map(({ x, y }) => `${x},${y}`)
            .join(' ');

          pathData += `${segment.type}${pointsString}`;
        });
      }

      return pathData + 'Z';
    })
    .join(' ')
    .trim();
