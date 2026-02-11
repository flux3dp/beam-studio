/**
 * Shape path generators for puzzle boundaries.
 * All shapes are centered at origin (0, 0).
 */

import { match } from 'ts-pattern';

import { DEFAULT_HEART_SHARPNESS, HEART_FIT_TO_GRID, HEART_VISUAL_HEIGHT_RATIO } from '../constants';
import type { ShapeMetadata, ShapeType } from '../types';

interface ShapeOptions {
  /** Center X coordinate (default: 0) */
  centerX?: number;
  /** Center Y coordinate (default: 0) */
  centerY?: number;
  /** Corner radius for rectangle, bottom point sharpness for heart (0-50) */
  cornerRadius?: number;
  /** Total height of the shape */
  height: number;
  /** Total width of the shape */
  width: number;
}

interface BorderOptions extends ShapeOptions {
  borderWidth: number;
}

export const generateRectanglePath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = 0, height, width } = options;

  const left = centerX - width / 2;
  const top = centerY - height / 2;
  const right = centerX + width / 2;
  const bottom = centerY + height / 2;

  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius, width / 2, height / 2);

    return [
      `M ${(left + r).toFixed(2)} ${top.toFixed(2)}`,
      `L ${(right - r).toFixed(2)} ${top.toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${right.toFixed(2)} ${(top + r).toFixed(2)}`,
      `L ${right.toFixed(2)} ${(bottom - r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(right - r).toFixed(2)} ${bottom.toFixed(2)}`,
      `L ${(left + r).toFixed(2)} ${bottom.toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${left.toFixed(2)} ${(bottom - r).toFixed(2)}`,
      `L ${left.toFixed(2)} ${(top + r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(left + r).toFixed(2)} ${top.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${left.toFixed(2)} ${top.toFixed(2)}`,
    `L ${right.toFixed(2)} ${top.toFixed(2)}`,
    `L ${right.toFixed(2)} ${bottom.toFixed(2)}`,
    `L ${left.toFixed(2)} ${bottom.toFixed(2)}`,
    'Z',
  ].join(' ');
};

export const generateEllipsePath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, height, width } = options;

  const radiusX = width / 2;
  const radiusY = height / 2;

  return [
    `M ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX - radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

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

export const generateHeartPath = (options: ShapeOptions): string => {
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

/**
 * Resolves shape metadata from state. Single source of truth for shape-specific behavior.
 * Adding a new shape to ShapeType will force an update here via .exhaustive().
 *
 * For heart with HEART_FIT_TO_GRID enabled:
 * - `boundaryHeight` is stretched (gridH / 0.925) so the heart's visual extremes fill the grid
 * - `centerYOffset` shifts the heart center so lobe peaks touch grid top and bottom point touches grid bottom
 *
 * Math: lobe peaks are at centerY - 0.425·H, bottom at centerY + 0.5·H.
 * Solving for both to touch ±gridH/2:
 *   scaledH = gridH / (0.425 + 0.5) = gridH / 0.925
 *   centerY = -gridH/2 + 0.425 · scaledH
 */
export const getShapeMetadata = (
  shapeType: ShapeType,
  state: { border: { radius: number }; pieceSize: number; radius?: number; rows: number },
): ShapeMetadata => {
  const gridH = state.rows * state.pieceSize;

  return match(shapeType)
    .with('circle', () => ({
      borderCornerRadius: state.border.radius,
      boundaryCornerRadius: 0,
      boundaryHeight: gridH,
      centerYOffset: 0,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: state.border.radius,
    }))
    .with('heart', () => {
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
    })
    .with('rectangle', () => {
      const puzzleRadius = state.radius ?? 0;

      return {
        borderCornerRadius: state.border.radius,
        boundaryCornerRadius: puzzleRadius,
        boundaryHeight: gridH,
        centerYOffset: 0,
        fillsBoundingBox: puzzleRadius <= 0,
        innerCutoutCornerRadius: puzzleRadius > 0 ? puzzleRadius : state.border.radius,
      };
    })
    .exhaustive();
};

export const generateShapePath = (shapeType: ShapeType, options: ShapeOptions): string =>
  match(shapeType)
    .with('circle', () => generateEllipsePath(options))
    .with('heart', () => generateHeartPath(options))
    .with('rectangle', () => generateRectanglePath(options))
    .exhaustive();

// ── Bézier offset utilities (used for heart border) ──────────────────────────

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

// ── Bézier offset utilities (used for heart border) ──────────────────────────

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
 * Updates:
 * 1. Trims segments at the center line to prevent overlapping loops ("lines over x coord").
 * 2. Uses a specific Arc sweep (1) at the top notch to ensure it curves UP (outward),
 * fixing the "weird curve below" issue.
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

  // [FIX] Trim any points that cross the center line ("remove lines over x coord")
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
          // [FIX] Top Notch: Use Sweep=1
          // This forces the arc to curve UP (outward) instead of dipping down.
          // This bridges the gap with a clean rounded top.
          parts.push(`A ${f(offset)} ${f(offset)} 0 0 1 ${f(nextFirst[0])} ${f(nextFirst[1])}`);
        } else {
          // Convex Corners (Lobes, Bottom): Use Sweep=0
          // Standard rounded corner.
          parts.push(`A ${f(offset)} ${f(offset)} 0 0 0 ${f(nextFirst[0])} ${f(nextFirst[1])}`);
        }
      }
    }
  }

  parts.push('Z');

  return parts.join(' ');
};

// ── Border path generation ───────────────────────────────────────────────────

export const generateBorderPath = (shapeType: ShapeType, options: BorderOptions): string => {
  const { borderWidth, cornerRadius = 0, height, width, ...rest } = options;

  if (shapeType === 'heart') {
    return generateOffsetHeartPath({ ...rest, cornerRadius, height, width }, borderWidth);
  }

  return generateShapePath(shapeType, {
    ...rest,
    cornerRadius,
    height: height + borderWidth * 2,
    width: width + borderWidth * 2,
  });
};

export interface RaisedEdgesOptions extends BorderOptions {
  /** Corner radius for the inner cutout (defaults to cornerRadius if not specified) */
  innerCornerRadius?: number;
}

/**
 * Generates a frame/raised edges path with inner cutout.
 * The outer boundary matches the board base size, inner boundary is the puzzle shape.
 * Uses even-odd fill rule to create the cutout effect.
 */
export const generateRaisedEdgesPath = (shapeType: ShapeType, options: RaisedEdgesOptions): string => {
  const { borderWidth, cornerRadius = 0, height, innerCornerRadius, width, ...rest } = options;

  const shapeOpts: ShapeOptions = { ...rest, cornerRadius, height, width };

  // Outer boundary — offset path for hearts, uniform expansion for others
  const outerPath =
    shapeType === 'heart'
      ? generateOffsetHeartPath(shapeOpts, borderWidth)
      : generateShapePath(shapeType, {
          ...rest,
          cornerRadius,
          height: height + borderWidth * 2,
          width: width + borderWidth * 2,
        });

  // Inner boundary (puzzle shape) — uses innerCornerRadius if specified
  const innerPath = generateShapePath(shapeType, {
    ...rest,
    cornerRadius: innerCornerRadius ?? cornerRadius,
    height,
    width,
  });

  // Combine paths - the inner path creates the cutout
  return `${outerPath} ${innerPath}`;
};

/**
 * Point-in-shape tests. All assume centered-at-origin coordinates.
 * - Ellipse: takes radii (half-dimensions)
 * - Heart/Rectangle: take full width/height; the dispatcher `isPointInShape` handles the conversion
 */
export const isPointInEllipse = (x: number, y: number, radiusX: number, radiusY: number): boolean =>
  (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;

/**
 * Point-in-heart test using the actual Bézier geometry.
 * Uses ray casting algorithm: count intersections with the heart boundary.
 * A point is inside if it has an odd number of intersections to the right.
 *
 * For symmetric results, we use the heart's left-right symmetry:
 * test with |x| and check the left half of the heart.
 */
export const isPointInHeart = (px: number, py: number, width: number, height: number): boolean => {
  // Get the same control points used by generateHeartPath
  const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } = computeHeartControlPoints(
    width,
    height,
    0, // centerY = 0 (centered at origin)
    DEFAULT_HEART_SHARPNESS,
  );

  // Quick bounds check
  if (py < topY || py > bottomY || Math.abs(px) > halfWidth) return false;

  // Use symmetry: test with absolute x value against left half of heart
  // This ensures perfectly symmetric results for left and right pieces
  const testX = -Math.abs(px);

  // Build polygon for LEFT HALF of heart only (from notch down left side and back)
  const STEPS = 48; // Higher resolution for accuracy
  const polygon: Array<[number, number]> = [];

  // Sample a cubic Bézier segment
  const sampleSegment = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
  ) => {
    for (let i = 0; i < STEPS; i++) {
      const t = i / STEPS;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];

      polygon.push([x, y]);
    }
  };

  // Left half: notch → left lobe → bottom → close with vertical line at x=0
  // Segment 1: notch → left lobe (top curve)
  sampleSegment([0, notchY], [0, topY], [-halfWidth, topY], [-halfWidth, notchY]);
  // Segment 2: left lobe → bottom
  sampleSegment([-halfWidth, notchY], [-halfWidth, bottomCtrl1Y], [-bottomCtrl2X, bottomCtrl2Y], [0, bottomY]);
  // Close the half with a straight line from bottom back to notch (along x=0)
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

export const isPointInRectangle = (x: number, y: number, width: number, height: number, cornerRadius = 0): boolean => {
  const hw = width / 2;
  const hh = height / 2;

  if (Math.abs(x) > hw || Math.abs(y) > hh) return false;

  if (cornerRadius <= 0) return true;

  const r = Math.min(cornerRadius, hw, hh);
  const ax = Math.abs(x);
  const ay = Math.abs(y);

  // Only check corner arcs when the point is in a corner region
  if (ax > hw - r && ay > hh - r) {
    const dx = ax - (hw - r);
    const dy = ay - (hh - r);

    return dx * dx + dy * dy <= r * r;
  }

  return true;
};

export const isPointInShape = (
  x: number,
  y: number,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius = 0,
  centerYOffset = 0,
): boolean =>
  match(shapeType)
    .with('circle', () => isPointInEllipse(x, y, width / 2, height / 2))
    .with('heart', () => isPointInHeart(x, y - centerYOffset, width, height))
    .with('rectangle', () => isPointInRectangle(x, y, width, height, cornerRadius))
    .exhaustive();

/** Draw shape path on a canvas context for Konva clipFunc */
export const drawShapeClipPath = (
  ctx: CanvasRenderingContext2D,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius: number = 0,
  centerYOffset: number = 0,
): void => {
  ctx.beginPath();

  match(shapeType)
    .with('circle', () => {
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    })
    .with('heart', () => {
      const { bottomCtrl1Y, bottomCtrl2X, bottomCtrl2Y, bottomY, halfWidth, notchY, topY } =
        computeHeartControlPoints(width, height, centerYOffset, DEFAULT_HEART_SHARPNESS);

      ctx.moveTo(0, notchY);
      ctx.bezierCurveTo(0, topY, -halfWidth, topY, -halfWidth, notchY);
      ctx.bezierCurveTo(-halfWidth, bottomCtrl1Y, -bottomCtrl2X, bottomCtrl2Y, 0, bottomY);
      ctx.bezierCurveTo(bottomCtrl2X, bottomCtrl2Y, halfWidth, bottomCtrl1Y, halfWidth, notchY);
      ctx.bezierCurveTo(halfWidth, topY, 0, topY, 0, notchY);
    })
    .with('rectangle', () => {
      const left = -width / 2;
      const top = -height / 2;

      if (cornerRadius > 0) {
        const r = Math.min(cornerRadius, width / 2, height / 2);

        ctx.moveTo(left + r, top);
        ctx.lineTo(left + width - r, top);
        ctx.arcTo(left + width, top, left + width, top + r, r);
        ctx.lineTo(left + width, top + height - r);
        ctx.arcTo(left + width, top + height, left + width - r, top + height, r);
        ctx.lineTo(left + r, top + height);
        ctx.arcTo(left, top + height, left, top + height - r, r);
        ctx.lineTo(left, top + r);
        ctx.arcTo(left, top, left + r, top, r);
      } else {
        ctx.rect(left, top, width, height);
      }
    })
    .exhaustive();

  ctx.closePath();
};
