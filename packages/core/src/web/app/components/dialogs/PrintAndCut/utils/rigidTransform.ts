import { dpmm } from '@core/app/actions/beambox/constant';

import { MATCH_TOLERANCE_MM, MATCH_TOLERANCE_RATIO } from '../constants';

export interface Point {
  x: number;
  y: number;
}

/** Rigid transform mapping expected mark positions onto detected ones: p' = R(angle)·p + (tx, ty) */
export interface RigidTransform {
  /** radians, counterclockwise in svg coordinates */
  angle: number;
  /** Per-point error (transformed expected − detected) in the sheet's frame, canvas px, in `from` order */
  errors: Point[];
  /** rms distance between transformed expected points and detected points */
  residual: number;
  /** rms error along the sheet's x axis (the mark rectangle's width direction) */
  residualX: number;
  /** rms error along the sheet's y axis (the mark rectangle's height direction) */
  residualY: number;
  /**
   * Best-fit similarity scale from `from` to `to`, diagnostic only: the
   * transform itself stays rigid (1 = the print came out at actual size)
   */
  scale: number;
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
  let fromNorm = 0;

  for (let i = 0; i < from.length; i += 1) {
    const fx = from[i].x - cFrom.x;
    const fy = from[i].y - cFrom.y;
    const tx = to[i].x - cTo.x;
    const ty = to[i].y - cTo.y;

    a += fx * tx + fy * ty;
    b += fx * ty - fy * tx;
    fromNorm += fx * fx + fy * fy;
  }

  const angle = Math.atan2(b, a);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = cTo.x - (cos * cFrom.x - sin * cFrom.y);
  const ty = cTo.y - (sin * cFrom.x + cos * cFrom.y);
  let sumX = 0;
  let sumY = 0;
  const errors: Point[] = [];

  for (let i = 0; i < from.length; i += 1) {
    const ex = cos * from[i].x - sin * from[i].y + tx - to[i].x;
    const ey = sin * from[i].x + cos * from[i].y + ty - to[i].y;
    // error rotated back into the sheet's frame, so each axis can be judged
    // against its own side of the mark rectangle
    const error = { x: cos * ex + sin * ey, y: cos * ey - sin * ex };

    errors.push(error);
    sumX += error.x ** 2;
    sumY += error.y ** 2;
  }

  return {
    angle,
    errors,
    residual: Math.sqrt((sumX + sumY) / from.length),
    residualX: Math.sqrt(sumX / from.length),
    residualY: Math.sqrt(sumY / from.length),
    scale: Math.hypot(a, b) / fromNorm,
    tx,
    ty,
  };
};

/**
 * Per-axis maximum rms fit error between transformed expected marks and
 * detected blobs, in canvas units (px): a fixed floor, or a fraction of the
 * mark rectangle's side along that axis for large designs where camera
 * distortion dominates.
 */
export const getMatchTolerance = (expected: Point[]): Point => {
  const xs = expected.map(({ x }) => x);
  const ys = expected.map(({ y }) => y);
  const floor = MATCH_TOLERANCE_MM * dpmm;

  return {
    x: Math.max(floor, MATCH_TOLERANCE_RATIO * (Math.max(...xs) - Math.min(...xs))),
    y: Math.max(floor, MATCH_TOLERANCE_RATIO * (Math.max(...ys) - Math.min(...ys))),
  };
};

export const exceedsTolerance = ({ residualX, residualY }: RigidTransform, tolerance: Point): boolean =>
  residualX > tolerance.x || residualY > tolerance.y;

/** Apply the transform to a point: R(angle)·p + (tx, ty) */
export const applyRigidTransform = ({ x, y }: Point, { angle, tx, ty }: RigidTransform): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return { x: cos * x - sin * y + tx, y: sin * x + cos * y + ty };
};

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
