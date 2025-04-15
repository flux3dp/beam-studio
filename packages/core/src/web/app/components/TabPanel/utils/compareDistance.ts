import type paper from 'paper';

export function compareDistance(point: paper.Point) {
  return (a: paper.HitResult, b: paper.HitResult) => {
    const nearestA = (a.item as paper.Path).getNearestPoint(point);
    const nearestB = (b.item as paper.Path).getNearestPoint(point);

    return nearestA.getDistance(point) - nearestB.getDistance(point);
  };
}
