import paper from 'paper';

/**
 * Creates a comparison function to sort paper.HitResult objects based on their
 * distance from a given point. Sorts in ascending order (closest first).
 * @param point - The reference point to measure distance from.
 * @returns A comparison function for Array.prototype.sort().
 */
export function compareDistance(point: paper.Point) {
  return (hitA: paper.HitResult, hitB: paper.HitResult): number => {
    // Ensure items are Paths before accessing getNearestPoint
    if (!(hitA.item instanceof paper.Path) || !(hitB.item instanceof paper.Path)) {
      console.warn('compareDistance encountered non-Path item in HitResult.');

      if (hitA.item instanceof paper.Path) return -1; // a comes first

      if (hitB.item instanceof paper.Path) return 1; // b comes first

      return 0; // both are non-paths
    }

    const nearestPointA = hitA.item.getNearestPoint(point);
    const nearestPointB = hitB.item.getNearestPoint(point);

    // Calculate distance from the reference point to the nearest point on each path
    const distanceA = nearestPointA.getDistance(point);
    const distanceB = nearestPointB.getDistance(point);

    // Return difference for sorting (negative if A is closer, positive if B is closer)
    return distanceA - distanceB;
  };
}
