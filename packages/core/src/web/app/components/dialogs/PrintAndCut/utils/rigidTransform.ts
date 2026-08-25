export interface Point {
  x: number;
  y: number;
}

/** Rigid transform mapping expected mark positions onto detected ones: p' = R(angle)·p + (tx, ty) */
export interface RigidTransform {
  /** radians, counterclockwise in svg coordinates */
  angle: number;
  /** rms distance between transformed expected points and detected points */
  residual: number;
  tx: number;
  ty: number;
}

export const centroid = (points: Point[]): Point => ({
  x: points.reduce((sum, { x }) => sum + x, 0) / points.length,
  y: points.reduce((sum, { y }) => sum + y, 0) / points.length,
});

/** Least-squares rigid transform (2D Kabsch) from `from` onto `to`, pairs matched by index */
export const fitRigidTransform = (from: Point[], to: Point[]): RigidTransform => {
  const cFrom = centroid(from);
  const cTo = centroid(to);
  let a = 0;
  let b = 0;

  for (let i = 0; i < from.length; i += 1) {
    const fx = from[i].x - cFrom.x;
    const fy = from[i].y - cFrom.y;
    const tx = to[i].x - cTo.x;
    const ty = to[i].y - cTo.y;

    a += fx * tx + fy * ty;
    b += fx * ty - fy * tx;
  }

  const angle = Math.atan2(b, a);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = cTo.x - (cos * cFrom.x - sin * cFrom.y);
  const ty = cTo.y - (sin * cFrom.x + cos * cFrom.y);
  let squaredSum = 0;

  for (let i = 0; i < from.length; i += 1) {
    const px = cos * from[i].x - sin * from[i].y + tx;
    const py = sin * from[i].x + cos * from[i].y + ty;

    squaredSum = squaredSum + (px - to[i].x) ** 2 + (py - to[i].y) ** 2;
  }

  return { angle, residual: Math.sqrt(squaredSum / from.length), tx, ty };
};

/** Apply the transform to a point: R(angle)·p + (tx, ty) */
export const applyRigidTransform = ({ x, y }: Point, { angle, tx, ty }: RigidTransform): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return { x: cos * x - sin * y + tx, y: sin * x + cos * y + ty };
};

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
