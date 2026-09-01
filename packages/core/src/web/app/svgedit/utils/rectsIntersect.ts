import type { IRect } from '@core/interfaces/ISVGCanvas';

/**
 * Check if two rectangles intersect each other.
 * Extracted from svgedit.math.rectsIntersect (public/js/lib/svgeditor/math.js).
 */
export const rectsIntersect = (r1: IRect, r2: IRect): boolean =>
  r2.x < r1.x + r1.width && r2.x + r2.width > r1.x && r2.y < r1.y + r1.height && r2.y + r2.height > r1.y;

export default rectsIntersect;
