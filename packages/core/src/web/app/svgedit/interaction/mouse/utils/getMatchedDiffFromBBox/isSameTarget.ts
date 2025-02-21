import type { IPoint } from '@core/interfaces/ISVGCanvas';

export function isSameTarget(
  target: IPoint,
  matched: Record<'x' | 'y', IPoint | null>,
  start: IPoint,
  point: IPoint,
): boolean {
  const isSameTargetOnDimension = (dimension: 'x' | 'y') => {
    const subDimension = dimension === 'x' ? 'y' : 'x';
    const mainMatched = matched[dimension];
    const subMatched = matched[subDimension];

    if (!mainMatched) return true;

    const estimatePoint = start[dimension] + mainMatched[dimension] - point[dimension];
    const estimateSubPoint = target[subDimension] - start[subDimension] + point[subDimension];
    const estimateDifference = Math.abs(estimatePoint - target[dimension]);
    const isSubValid = subMatched?.[subDimension]
      ? Math.abs(estimateSubPoint - subMatched?.[subDimension]) < 0.01
      : true;

    return estimateDifference <= 0.01 && isSubValid;
  };

  return isSameTargetOnDimension('x') && isSameTargetOnDimension('y');
}
