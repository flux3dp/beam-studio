import type { IPoint } from '@core/interfaces/ISVGCanvas';

type By = { byX: IPoint; byY: IPoint };

export function isSameTarget(target: IPoint, matched: By, start: IPoint, point: IPoint, dimension: 'x' | 'y'): boolean {
  const subDimension = dimension === 'x' ? 'y' : 'x';
  const mainMatched = matched[`by${dimension.toUpperCase()}` as 'byX' | 'byY'];
  const subMatched = matched[`by${subDimension.toUpperCase()}` as 'byX' | 'byY'];

  if (!mainMatched) return true;

  const estimatePoint = start[dimension] + mainMatched[dimension] - point[dimension];
  const estimateSubPoint = target[subDimension] - start[subDimension] + point[subDimension];
  const estimateDifference = Math.abs(estimatePoint - target[dimension]);
  const isSubValid = subMatched?.[subDimension] ? Math.abs(estimateSubPoint - subMatched?.[subDimension]) < 0.01 : true;

  return estimateDifference <= 0.01 && isSubValid;
}
