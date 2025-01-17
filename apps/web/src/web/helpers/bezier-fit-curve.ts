// refs: https://stackoverflow.com/questions/6299019/, https://stackoverflow.com/questions/5525665/
import { vector2D, v2Add, v2Sub, v2Length, v2Normalize, v2Scale, v2Distance, v2Dot, v2Sum, v2Negate, v2Angle } from './vector-2d';

const maxIterations = 4;
// Tuned parameters
const angleThreshold = Math.PI / 3; // rad
const allowedDistFactor = 30;
const minAllowedDist = 200; // pixel

interface Segment2D {
  type: string, // 'C' or 'L'
  points: vector2D[],
};

let output = [] as Segment2D[];

export const fitPath = (points: vector2D[]) => {
  output = [];

  let start = 0;
  let currentVecotr = v2Sub(points[0], points[points.length - 1]);
  let accumulatedDist = 0;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const dist = Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y);
    accumulatedDist += dist;
  }
  const totalDist = accumulatedDist;
  accumulatedDist = 0;
  const allowedDist = Math.min(totalDist / allowedDistFactor, minAllowedDist);

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const dist = Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y);
    const v = v2Sub(points[i], points[i - 1]);
    const angle = v2Angle(currentVecotr, v);

    if (accumulatedDist + dist >= allowedDist || angle > angleThreshold) {
      if (start !== i - 1) {
        const vStart = computeLeftTangent(points, start);
        const vEnd = computeRightTangent(points, i - 1);
        fitSegment(points, start, i - 1, vStart, vEnd, accumulatedDist / 30);
      }
      start = i - 1;
      accumulatedDist = 0;
    }
    accumulatedDist += dist;
    currentVecotr = v;
    if (i === points.length - 1) {
      const vStart = computeLeftTangent(points, start);
      const vEnd = computeRightTangent(points, i);
      fitSegment(points, start, i, vStart, vEnd, accumulatedDist / 30);
    }
  }

  return output;
};

const addToOutput = (segment: Segment2D) => {
  output.push(segment);
};

const fitSegment = (points: vector2D[], start: number, end: number, vStart: vector2D, vEnd: vector2D, allowedError: number) => {
  const allowedIterationError = allowedError > 1 ? allowedError * allowedError : Math.sqrt(allowedError);
  const numPoints = end - start + 1;
  if (numPoints === 1) {
    return;
  }
  if (numPoints <= 4) {
    for (let i = start; i < end; i += 1) {
      const seg = {
        type: 'L',
        points: [points[i], points[i + 1]],
      } as Segment2D;
      addToOutput(seg);
    }
    return;
  }

  let u = chordLengthParameterize(points, start, end);
  let bezierCurveControlPoints = generateBezier(points, start, end, u, vStart, vEnd);
  let { maxError, splitPoint } = computeMaxError(points, start, end, bezierCurveControlPoints, u);
  if (maxError < allowedError) {
    const seg = {
      type: 'C',
      points: bezierCurveControlPoints,
    } as Segment2D;
    addToOutput(seg);
    return;
  }

  if (maxError < allowedIterationError) {
    for (let i = 0; i < maxIterations; i += 1) {
      u = reparameterize(points, start, end, bezierCurveControlPoints, u);
      bezierCurveControlPoints = generateBezier(points, start, end, u, vStart, vEnd);
      const { maxError: error, splitPoint: sp } = computeMaxError(points, start, end, bezierCurveControlPoints, u);
      if (error < allowedError) {
        const seg = {
          type: 'C',
          points: bezierCurveControlPoints,
        } as Segment2D;
        addToOutput(seg);
        return;
      }
      splitPoint = sp;
    }
  }

  const vCenter = computeCenterTangent(points, splitPoint);
  fitSegment(points, start, splitPoint, vStart, vCenter, allowedError);
  fitSegment(points, splitPoint, end, v2Negate(vCenter), vEnd, allowedError);
};

const chordLengthParameterize = (points: vector2D[], start: number, end: number) => {
  // u is guess value of bezier curve t value where the points are.
  const u = new Array(end - start + 1) as number[];
  u[0] = 0;

  for (let i = start + 1; i <= end; i += 1) {
    u[i - start] = u[i - start - 1] + v2Distance(points[i - 1], points[i]);
  }
  for (let i = start + 1; i <= end; i += 1) {
    if (u[end - start] > 0) {
      u[i - start] /= u[end - start];
    } else {
      u[i - start] = 0;
    }
  }
  return u;
};

// Use regression to get bezier control points
const generateBezier = (points: vector2D[], start: number, end: number, u: number[], vStart: vector2D, vEnd: vector2D) => {
  const numPoints = end - start + 1;
  const A = new Array(numPoints) as vector2D[][];

  for (let i = 0; i < numPoints; i += 1) {
    A[i] = [v2Scale(vStart, B1(u[i])), v2Scale(vEnd, B2(u[i]))];
  }
  const C = [
    [0, 0],
    [0, 0],
  ];
  const X = [0, 0];

  for (let i = 0; i < numPoints; i += 1) {
    C[0][0] += v2Dot(A[i][0], A[i][0]);
    C[0][1] += v2Dot(A[i][0], A[i][1]);
    C[1][0] = C[0][1];
    C[1][1] += v2Dot(A[i][1], A[i][1]);
    let tmp = v2Sum(v2Scale(points[start], B0(u[i])), v2Scale(points[start], B1(u[i])), v2Scale(points[end], B2(u[i])), v2Scale(points[end], B3(u[i])));
    tmp = v2Sub(points[start + i], tmp);
    X[0] += v2Dot(A[i][0], tmp);
    X[1] += v2Dot(A[i][1], tmp);
  }

  let detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
  const detC0X = C[0][0] * X[1] - C[1][0] * X[0];
  const detXC1 = X[0] * C[1][1] - X[1] * C[0][1];

  if (detC0C1 === 0) {
    detC0C1 = C[0][0] * C[1][1] * 1e-11;
  }
  const alphaL = Math.abs(detC0C1) > 0 ? detXC1 / detC0C1 : 0;
  const alphaR = Math.abs(detC0C1) > 0 ? detC0X / detC0C1 : 0;

  if (Math.abs(alphaL) < 1e-6 || Math.abs(alphaR) < 1e-6) {
    const dist = v2Distance(points[start], points[end]);
    const controlPoint2 = v2Add(points[start], v2Scale(vStart, dist / 3));
    const controlPoint3 = v2Add(points[end], v2Scale(vEnd, dist / 3));
    return [points[start], controlPoint2, controlPoint3, points[end]];
  } else {
    const controlPoint2 = v2Add(points[start], v2Scale(vStart, alphaL));
    const controlPoint3 = v2Add(points[end], v2Scale(vEnd, alphaR));
    return [points[start], controlPoint2, controlPoint3, points[end]];
  }
};

const reparameterize = (points: vector2D[], start: number, end: number, curveControlPoints: vector2D[], u: number[]) => {
  const numPoints = end - start + 1;
  const uPrime = new Array(numPoints) as number[];
  for (let i = start; i <= end; i += 1) {
    uPrime[i - start] = NewtonRaphsonRootFind(curveControlPoints, points[i], u[i - start]);
  }
  return uPrime;
};

const NewtonRaphsonRootFind = (curveControlPoints: vector2D[], point: vector2D, currentU: number) => {
  const Q1 = new Array(3) as vector2D[];
  const Q2 = new Array(2) as vector2D[];

  const pointU = bezierCurveValue(3, curveControlPoints, currentU);
  for (let i = 0; i <= 2; i += 1) {
    const x = (curveControlPoints[i + 1].x - curveControlPoints[i].x) * 3;
    const y = (curveControlPoints[i + 1].y - curveControlPoints[i].y) * 3;
    Q1[i] = { x, y };
  }
  for (let i = 0; i <= 1; i += 1) {
    const x = (Q1[i + 1].x - Q1[i].x) * 2;
    const y = (Q1[i + 1].y - Q1[i].y) * 2;
    Q2[i] = { x, y };
  }
  const point1U = bezierCurveValue(2, Q1, currentU);
  const point2U = bezierCurveValue(1, Q2, currentU);

  const numerator = (pointU.x - point.x) * point1U.x + (pointU.y - point.y) * point1U.y;
  const denominator = point1U.x ** 2 + point1U.y ** 2 + (pointU.x - point.x) * point2U.x + (pointU.y - point.y) * point2U.y;

  const newU = currentU * (numerator / denominator);
  return newU;
}

const computeMaxError = (points: vector2D[], start: number, end: number, curveControlPoints: vector2D[], u: number[]) => {
  let splitPoint = Math.floor((end - start + 1) / 2);
  let maxError = 0;

  for (let i = start + 1; i < end; i += 1) {
    const point = bezierCurveValue(3, curveControlPoints, u[i - start]);
    const v = v2Sub(points[i], point);
    const dist = v2Length(v) ** 2;
    if (dist > maxError) {
      maxError = dist;
      splitPoint = i;
    }
  }
  return { maxError, splitPoint };
};

const computeLeftTangent = (points: vector2D[], index: number) => {
  const res = v2Normalize(v2Sub(points[index + 1], points[index]));
  return res;
};

const computeRightTangent = (points: vector2D[], index: number) => {
  const res = v2Normalize(v2Sub(points[index - 1], points[index]));
  return res;
};

const computeCenterTangent = (points: vector2D[], index: number) => {
  const v1 = v2Sub(points[index - 1], points[index]);
  const v2 = v2Sub(points[index], points[index + 1]);
  let res = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 } as vector2D;
  res = v2Normalize(res);
  return res;
};

const bezierCurveValue = (degree: number, curveControlPoints: vector2D[], t: number) => {
  const tempControlPoints = new Array(degree + 1) as vector2D[];
  for (let i = 0; i <= degree; i += 1) {
    tempControlPoints[i] = { x: curveControlPoints[i].x, y: curveControlPoints[i].y };
  }

  for (let i = 1; i <= degree; i += 1) {
    for (let j = 0; j <= degree - i; j += 1) {
      tempControlPoints[j].x = (1 - t) * tempControlPoints[j].x + t * tempControlPoints[j + 1].x;
      tempControlPoints[j].y = (1 - t) * tempControlPoints[j].y + t * tempControlPoints[j + 1].y;
    }
  }
  return tempControlPoints[0];
};

const B0 = (t: number) => {
  const temp = 1 - t;
  return temp * temp * temp;
};

const B1 = (t: number) => {
  const temp = 1 - t;
  return 3 * t * temp * temp;
};

const B2 = (t: number) => {
  const temp = 1 - t;
  return 3 * t * t * temp;
};

const B3 = (t: number) => t * t * t;
