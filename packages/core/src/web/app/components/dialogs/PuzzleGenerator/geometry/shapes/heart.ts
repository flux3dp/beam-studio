/**
 * Heart shape implementation.
 *
 * Includes all heart-specific helpers:
 * - Bézier control point computation
 * - Bézier offset utilities for border generation
 * - Ray-casting point-in-heart test with symmetry optimization
 * - Grid fitting logic (HEART_FIT_TO_GRID) in getMetadata
 */

import { DEFAULT_HEART_SHARPNESS, HEART_FIT_TO_GRID, HEART_VISUAL_HEIGHT_RATIO } from '../../constants';
import type { ShapeMetadata } from '../../types';

import type { BorderOptions, MetadataInput, ShapeGenerator, ShapeOptions } from './types';

// ── Heart control points ────────────────────────────────────────────────────

interface HeartControlPoints {
  bottomCtrl1Y: number;
  bottomCtrl2X: number;
  bottomCtrl2Y: number;
  bottomY: number;
  halfWidth: number;
  notchY: number;
  topY: number;
}

/** Single source of truth for heart shape geometry — used by path, offset, and clip generators. */
const computeHeartControlPoints = (
  width: number,
  height: number,
  centerY: number,
  cornerRadius: number,
): HeartControlPoints => {
  const topCurveHeight = height * 0.3;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const topY = centerY - halfHeight;
  const notchY = topY + topCurveHeight;
  const bottomY = centerY + halfHeight;

  const sharpness = 1 - cornerRadius / 50;
  const bottomPullFactor = 0.3 + sharpness * 0.5;
  const bottomCtrl1Y = notchY + (bottomY - notchY) * 0.4;
  const bottomCtrl2X = halfWidth * bottomPullFactor;
  const bottomCtrl2Y = bottomY - (bottomY - notchY) * (0.2 + (1 - sharpness) * 0.3);

  return { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY };
};

// ── Heart path generation ───────────────────────────────────────────────────

const generateHeartPath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = DEFAULT_HEART_SHARPNESS, height, width } = options;
  const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } = computeHeartControlPoints(
    width,
    height,
    centerY,
    cornerRadius,
  );

  return [
    `M ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${centerX.toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${(centerX - halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX - bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${centerX.toFixed(2)} ${bottomY.toFixed(2)}`,
    `C ${(centerX + bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${(centerX + halfWidth).toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// ── Bézier offset utilities (for heart border) ─────────────────────────────

type Point = [number, number];
type CubicSegment = [Point, Point, Point, Point];

/** Evaluate a cubic Bézier at parameter t. */
const cubicAt = ([p0, p1, p2, p3]: CubicSegment, t: number): Point => {
  const u = 1 - t;

  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

/** Tangent (derivative) of a cubic Bézier at parameter t. */
const cubicTangentAt = ([p0, p1, p2, p3]: CubicSegment, t: number): Point => {
  const u = 1 - t;

  return [
    3 * (u * u * (p1[0] - p0[0]) + 2 * u * t * (p2[0] - p1[0]) + t * t * (p3[0] - p2[0])),
    3 * (u * u * (p1[1] - p0[1]) + 2 * u * t * (p2[1] - p1[1]) + t * t * (p3[1] - p2[1])),
  ];
};

/** Outward unit normal for counter-clockwise winding in Y-down coords: (-dy, dx). */
const outwardNormal = ([dx, dy]: Point): Point => {
  const len = Math.sqrt(dx * dx + dy * dy);

  return len < 1e-10 ? [0, 0] : [-dy / len, dx / len];
};

/** Sample a Bézier segment into offset points (excluding t=1 to avoid duplicates). */
const sampleOffsetSegment = (seg: CubicSegment, offset: number, count: number): Point[] => {
  const pts: Point[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const [px, py] = cubicAt(seg, t);
    const tangent = cubicTangentAt(seg, t);
    const [nx, ny] = outwardNormal(tangent);

    if (nx === 0 && ny === 0) continue;

    pts.push([px + nx * offset, py + ny * offset]);
  }

  return pts;
};

/**
 * Generate an SVG path offset outward from the heart by `offset` mm.
 * Trims segments at the center line to prevent overlapping loops,
 * and uses specific arc sweep at the top notch to curve outward.
 */
const generateOffsetHeartPath = (options: ShapeOptions, offset: number): string => {
  const { centerX = 0, centerY = 0, cornerRadius = DEFAULT_HEART_SHARPNESS, height, width } = options;
  const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } = computeHeartControlPoints(
    width,
    height,
    centerY,
    cornerRadius,
  );

  const segments: CubicSegment[] = [
    [
      [centerX, notchY],
      [centerX, topY],
      [centerX - halfWidth, topY],
      [centerX - halfWidth, notchY],
    ],
    [
      [centerX - halfWidth, notchY],
      [centerX - halfWidth, bottomCtrl1Y],
      [centerX - bottomCtrl2X, bottomCtrl2Y],
      [centerX, bottomY],
    ],
    [
      [centerX, bottomY],
      [centerX + bottomCtrl2X, bottomCtrl2Y],
      [centerX + halfWidth, bottomCtrl1Y],
      [centerX + halfWidth, notchY],
    ],
    [
      [centerX + halfWidth, notchY],
      [centerX + halfWidth, topY],
      [centerX, topY],
      [centerX, notchY],
    ],
  ];

  const N = 512;
  const segPoints = segments.map((seg) => sampleOffsetSegment(seg, offset, N));

  // Trim points that cross the center line to prevent overlapping loops
  // Left Lobe (Seg 0): Keep x <= centerX
  segPoints[0] = segPoints[0].filter((p) => p[0] <= centerX);
  // Right Lobe (Seg 3): Keep x >= centerX
  segPoints[3] = segPoints[3].filter((p) => p[0] >= centerX);

  // Ensure segments aren't empty after trimming (fallback to original start/end)
  if (segPoints[0].length === 0) segPoints[0].push([centerX - offset, notchY]);

  if (segPoints[3].length === 0) segPoints[3].push([centerX + offset, notchY]);

  const f = (v: number) => v.toFixed(2);
  const parts: string[] = [];

  // Start path
  const firstPt = segPoints[0][0];

  parts.push(`M ${f(firstPt[0])} ${f(firstPt[1])}`);

  for (let s = 0; s < segments.length; s++) {
    const pts = segPoints[s];

    if (pts.length === 0) continue;

    // Line segments
    const startIdx = s === 0 ? 1 : 0;

    for (let i = startIdx; i < pts.length; i++) {
      parts.push(`L ${f(pts[i][0])} ${f(pts[i][1])}`);
    }

    // Join to next segment
    const nextS = (s + 1) % segments.length;
    const lastPt = pts[pts.length - 1];
    const nextPts = segPoints[nextS];

    if (nextPts.length > 0) {
      const nextFirst = nextPts[0];
      const gap = Math.sqrt((lastPt[0] - nextFirst[0]) ** 2 + (lastPt[1] - nextFirst[1]) ** 2);

      if (gap > 0.01) {
        if (s === 3) {
          // Top Notch: Use Sweep=1 to force arc to curve UP (outward)
          parts.push(`A ${f(offset)} ${f(offset)} 0 0 1 ${f(nextFirst[0])} ${f(nextFirst[1])}`);
        } else {
          // Convex Corners (Lobes, Bottom): Use Sweep=0
          parts.push(`A ${f(offset)} ${f(offset)} 0 0 0 ${f(nextFirst[0])} ${f(nextFirst[1])}`);
        }
      }
    }
  }

  parts.push('Z');

  return parts.join(' ');
};

// ── Point-in-heart test ─────────────────────────────────────────────────────

/**
 * Point-in-heart test using the actual Bézier geometry.
 * Uses ray casting algorithm with the heart's left-right symmetry:
 * test with |x| against the left half of the heart.
 */
const isPointInHeart = (px: number, py: number, width: number, height: number): boolean => {
  const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } = computeHeartControlPoints(
    width,
    height,
    0, // centerY = 0 (centered at origin)
    DEFAULT_HEART_SHARPNESS,
  );

  // Quick bounds check
  if (py < topY || py > bottomY || Math.abs(px) > halfWidth) return false;

  // Use symmetry: test with absolute x value against left half of heart
  const testX = -Math.abs(px);

  // Build polygon for LEFT HALF of heart only (from notch down left side and back)
  const STEPS = 48;
  const polygon: Array<[number, number]> = [];

  const sampleSegment = (p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]) => {
    for (let i = 0; i < STEPS; i++) {
      const t = i / STEPS;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];

      polygon.push([x, y]);
    }
  };

  // Left half: notch → left lobe → bottom → close with vertical line at x=0
  sampleSegment([0, notchY], [0, topY], [-halfWidth, topY], [-halfWidth, notchY]);
  sampleSegment([-halfWidth, notchY], [-halfWidth, bottomCtrl1Y], [-bottomCtrl2X, bottomCtrl2Y], [0, bottomY]);
  polygon.push([0, bottomY]);
  polygon.push([0, notchY]);

  // Ray casting algorithm
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > py !== yj > py && testX < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

// ── ShapeGenerator implementation ───────────────────────────────────────────

export const heartShape: ShapeGenerator = {
  drawClipPath(ctx, width, height, _cornerRadius, centerYOffset = 0) {
    const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } = computeHeartControlPoints(
      width,
      height,
      centerYOffset,
      DEFAULT_HEART_SHARPNESS,
    );

    ctx.beginPath();
    ctx.moveTo(0, notchY);
    ctx.bezierCurveTo(0, topY, -halfWidth, topY, -halfWidth, notchY);
    ctx.bezierCurveTo(-halfWidth, bottomCtrl1Y, -bottomCtrl2X, bottomCtrl2Y, 0, bottomY);
    ctx.bezierCurveTo(bottomCtrl2X, bottomCtrl2Y, halfWidth, bottomCtrl1Y, halfWidth, notchY);
    ctx.bezierCurveTo(halfWidth, topY, 0, topY, 0, notchY);
    ctx.closePath();
  },

  generateBorderPath(options: BorderOptions): string {
    const { borderWidth, ...rest } = options;

    return generateOffsetHeartPath(rest, borderWidth);
  },

  generatePath: generateHeartPath,

  getMetadata(input: MetadataInput): ShapeMetadata {
    const gridH = input.rows * input.pieceSize;

    if (HEART_FIT_TO_GRID) {
      const scaledH = gridH / HEART_VISUAL_HEIGHT_RATIO;
      // Shift center so lobe peaks (-0.425·scaledH from center) touch grid top (-gridH/2)
      const centerY = -gridH / 2 + 0.425 * scaledH;

      return {
        borderCornerRadius: DEFAULT_HEART_SHARPNESS,
        boundaryCornerRadius: DEFAULT_HEART_SHARPNESS,
        boundaryHeight: scaledH,
        centerYOffset: centerY,
        fillsBoundingBox: false,
        innerCutoutCornerRadius: DEFAULT_HEART_SHARPNESS,
      };
    }

    return {
      borderCornerRadius: DEFAULT_HEART_SHARPNESS,
      boundaryCornerRadius: DEFAULT_HEART_SHARPNESS,
      boundaryHeight: gridH,
      centerYOffset: 0,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: DEFAULT_HEART_SHARPNESS,
    };
  },

  isPointInside(x, y, width, height, _cornerRadius, centerYOffset = 0) {
    return isPointInHeart(x, y - centerYOffset, width, height);
  },
};
