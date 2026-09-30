export type Point = [number, number];

export interface MinAreaRect {
  /** direction of the long edge, rad, in (-π/2, π/2] */
  angle: number;
  center: Point;
  /** short edge */
  height: number;
  /** polygon area / rect area, 1 for a perfect rectangle, ~0.785 for a circle */
  rectangularity: number;
  /** long edge */
  width: number;
}

const cross = (o: Point, a: Point, b: Point): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Andrew's monotone chain; returns the hull counter-clockwise without the closing point. */
export const convexHull = (points: Point[]): Point[] => {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  if (sorted.length < 3) return sorted;

  const half = (input: Point[]): Point[] => {
    const out: Point[] = [];

    for (const p of input) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();

      out.push(p);
    }

    out.pop();

    return out;
  };

  return [...half(sorted), ...half(sorted.reverse())];
};

/** Shoelace, absolute value. */
export const polygonArea = (points: Point[]): number => {
  let sum = 0;

  for (let i = 0, n = points.length; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];

    sum += x1 * y2 - x2 * y1;
  }

  return Math.abs(sum) / 2;
};

/**
 * Minimum-area bounding rectangle of a polygon (the cv::minAreaRect equivalent, but with the
 * long edge identified so the angle is unambiguous). The minimum rect always shares an edge
 * direction with the convex hull, so every hull edge is tried.
 */
export const getMinAreaRect = (polygon: Point[]): MinAreaRect => {
  const hull = convexHull(polygon);
  const area = polygonArea(polygon);
  let best: MinAreaRect = { angle: 0, center: [0, 0], height: 0, rectangularity: 0, width: 0 };
  let bestArea = Infinity;

  // ponytail: O(h²) over the hull; fine for RDP-simplified polygons (tens of points)
  for (let i = 0, n = hull.length; i < n; i++) {
    const [x1, y1] = hull[i];
    const [x2, y2] = hull[(i + 1) % n];
    const edge = Math.hypot(x2 - x1, y2 - y1);

    if (edge === 0) continue;

    const ux = (x2 - x1) / edge;
    const uy = (y2 - y1) / edge;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    for (const [x, y] of hull) {
      const u = x * ux + y * uy;
      const v = -x * uy + y * ux;

      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }

    const w = maxU - minU;
    const h = maxV - minV;
    const rectArea = w * h;

    if (rectArea >= bestArea) continue;

    bestArea = rectArea;

    const cu = (minU + maxU) / 2;
    const cv = (minV + maxV) / 2;
    const center: Point = [cu * ux - cv * uy, cu * uy + cv * ux];
    let angle = w >= h ? Math.atan2(uy, ux) : Math.atan2(ux, -uy);

    if (angle <= -Math.PI / 2) angle += Math.PI;
    else if (angle > Math.PI / 2) angle -= Math.PI;

    best = {
      angle,
      center,
      height: Math.min(w, h),
      rectangularity: rectArea ? area / rectArea : 0,
      width: Math.max(w, h),
    };
  }

  return best;
};
