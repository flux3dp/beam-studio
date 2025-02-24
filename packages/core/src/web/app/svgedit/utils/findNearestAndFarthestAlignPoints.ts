import type { IPoint } from '@core/interfaces/ISVGCanvas';

export function findNearestAndFarthestAlignPoints(
  alignPoints: Record<'x' | 'y', IPoint[]>,
  target: IPoint,
  dimension: 'x' | 'y',
  fuzzyRange: number,
): [IPoint, IPoint] | [null, null] {
  const points = alignPoints[dimension];
  const pointsArray = points.map((p) => p[dimension]);
  const { length } = points;
  const subDimension = dimension === 'x' ? 'y' : 'x';
  let [start, end] = [0, length - 1];

  if (target[dimension] < points[start][dimension] - fuzzyRange) return [null, null];
  else if (target[dimension] > points[end][dimension] + fuzzyRange) return [null, null];

  const predicate = (num: number) => {
    const diff = num - target[dimension];

    if (Math.abs(diff) <= fuzzyRange) return 0;

    return diff > 0 ? 1 : -1;
  };

  const first = BinarySearchOccurrence(pointsArray, predicate, 'first');

  if (first === -1) return [null, null];

  const last = BinarySearchOccurrence(pointsArray, predicate, 'last');
  const nearestPoint = points.slice(first, last + 1).reduce((prev, curr) => {
    const prevDiff = Math.abs(prev[subDimension] - target[subDimension]);
    const currDiff = Math.abs(curr[subDimension] - target[subDimension]);

    return prevDiff < currDiff ? prev : curr;
  });
  const dir = nearestPoint[subDimension] - target[subDimension];
  const farthestPoint = points
    .slice(first, last + 1)
    .filter((p) => (p[subDimension] - target[subDimension]) * dir > 0 && p[dimension] === nearestPoint[dimension])
    .reduce((prev, curr) => {
      const prevDiff = Math.abs(prev[subDimension] - target[subDimension]);
      const currDiff = Math.abs(curr[subDimension] - target[subDimension]);

      return prevDiff > currDiff ? prev : curr;
    }, nearestPoint);

  return [nearestPoint, farthestPoint];
}

function BinarySearchOccurrence(array: number[], predicate: (num: number) => number, by: 'first' | 'last'): number {
  const { length } = array;
  let result = -1;
  let [start, end] = [0, length - 1];
  const updateScope =
    by === 'first'
      ? (mid: number) => {
          end = mid - 1;
        }
      : (mid: number) => {
          start = mid + 1;
        };

  while (start <= end) {
    const mid = ~~(start + ((end - start) >> 1));
    const value = array[mid];

    if (predicate(value) === 0) {
      result = mid;
      updateScope(mid);
    } else if (predicate(value) === -1) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  return result;
}
