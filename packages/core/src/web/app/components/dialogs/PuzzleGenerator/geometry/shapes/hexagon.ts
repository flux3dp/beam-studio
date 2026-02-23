/**
 * Hexagon shape implementation.
 *
 * Flat-top hexagon stretched to fill grid dimensions.
 * Supports rounded corners with angle-aware arc radius.
 */

import type { ShapeMetadata } from '../../types';

import { createExpandedBorderPath, type MetadataInput, type ShapeGenerator, type ShapeOptions } from './types';

// ── Hexagon geometry utilities ──────────────────────────────────────────────

type Point = [number, number];

/** Compute the 6 vertices of a flat-top hexagon centered at (cx, cy) with given width and height. */
const computeHexVertices = (width: number, height: number, cx: number, cy: number): Point[] => {
  const hw = width / 2;
  const hh = height / 2;
  const qw = width / 4;

  // Flat-top: right, upper-right, upper-left, left, lower-left, lower-right
  return [
    [cx + hw, cy],
    [cx + qw, cy - hh],
    [cx - qw, cy - hh],
    [cx - hw, cy],
    [cx - qw, cy + hh],
    [cx + qw, cy + hh],
  ];
};

/** Normalize a vector (returns unit vector) */
const normalize = (p: Point): Point => {
  const len = Math.sqrt(p[0] * p[0] + p[1] * p[1]);

  return len > 1e-10 ? [p[0] / len, p[1] / len] : [0, 0];
};

/** Vector from point a to point b */
const vectorBetween = (from: Point, to: Point): Point => [to[0] - from[0], to[1] - from[1]];

/**
 * Compute the tangent-point distance from a vertex for a given arc radius.
 *
 * For a polygon corner with interior angle θ, an inscribed arc of radius R
 * touches each edge at distance `d = R / tan(θ/2)` from the vertex.
 * At 90° (rectangle) d = R; at 120° (regular hex) d ≈ 1.73·R.
 */
const computeTangentDistance = (curr: Point, prev: Point, next: Point, arcRadius: number): number => {
  const v1 = vectorBetween(curr, prev);
  const v2 = vectorBetween(curr, next);
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
  const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
  const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  const halfAngle = Math.acos(cosAngle) / 2;
  const tanHalf = Math.tan(halfAngle);

  return tanHalf > 1e-10 ? arcRadius / tanHalf : arcRadius;
};

/** Compute tangent points for a corner with arc radius r */
const computeTangentPoints = (
  curr: Point,
  prev: Point,
  next: Point,
  r: number,
): { d: number; fromPrev: Point; toNext: Point } => {
  const d = computeTangentDistance(curr, prev, next, r);
  const toPrev = normalize(vectorBetween(curr, prev));
  const toNext = normalize(vectorBetween(curr, next));

  return {
    d,
    fromPrev: [curr[0] + toPrev[0] * d, curr[1] + toPrev[1] * d],
    toNext: [curr[0] + toNext[0] * d, curr[1] + toNext[1] * d],
  };
};

/** Clamp the arc radius for hex corners so tangent distances don't exceed half-edge lengths. */
const clampHexRadius = (vertices: Point[], cornerRadius: number): number => {
  const n = vertices.length;
  let maxR = cornerRadius;

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    const d = computeTangentDistance(curr, prev, next, cornerRadius);
    const edgePrevLen = Math.sqrt((prev[0] - curr[0]) ** 2 + (prev[1] - curr[1]) ** 2);
    const edgeNextLen = Math.sqrt((next[0] - curr[0]) ** 2 + (next[1] - curr[1]) ** 2);
    const maxD = Math.min(edgePrevLen / 2, edgeNextLen / 2);

    if (d > maxD) {
      maxR = Math.min(maxR, (maxD / d) * cornerRadius);
    }
  }

  return maxR;
};

// ── Hex path generation ─────────────────────────────────────────────────────

/**
 * Generate SVG path for a flat-top hexagon with optional rounded corners.
 *
 * `cornerRadius` is the **arc radius** (like CSS border-radius).
 * Tangent-point distances are derived from the actual interior angle at each vertex,
 * so arcs look correct even on stretched (non-regular) hexagons.
 */
const generateHexPath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = 0, height, width } = options;
  const vertices = computeHexVertices(width, height, centerX, centerY);
  const n = vertices.length;
  const f = (v: number) => v.toFixed(2);

  if (cornerRadius <= 0) {
    const parts = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${f(v[0])} ${f(v[1])}`);

    parts.push('Z');

    return parts.join(' ');
  }

  const r = clampHexRadius(vertices, cornerRadius);
  const parts: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    const { fromPrev, toNext } = computeTangentPoints(curr, prev, next, r);

    if (i === 0) {
      parts.push(`M ${f(toNext[0])} ${f(toNext[1])}`);
    } else {
      parts.push(`L ${f(fromPrev[0])} ${f(fromPrev[1])}`);
      parts.push(`A ${f(r)} ${f(r)} 0 0 0 ${f(toNext[0])} ${f(toNext[1])}`);
    }
  }

  // Close: arc around vertex 0
  const { fromPrev, toNext } = computeTangentPoints(vertices[0], vertices[n - 1], vertices[1], r);

  parts.push(`L ${f(fromPrev[0])} ${f(fromPrev[1])}`);
  parts.push(`A ${f(r)} ${f(r)} 0 0 0 ${f(toNext[0])} ${f(toNext[1])}`);
  parts.push('Z');

  return parts.join(' ');
};

// ── Point-in-hex test ───────────────────────────────────────────────────────

/**
 * Point-in-hexagon test with radius-aware corner refinement.
 * Two-phase approach (like rectangle):
 * 1. Check if inside sharp hex polygon
 * 2. If radius > 0 and point is in a corner region, refine with arc check
 */
const isPointInHex = (px: number, py: number, width: number, height: number, cornerRadius = 0): boolean => {
  const vertices = computeHexVertices(width, height, 0, 0);
  const n = vertices.length;

  // Phase 1: Ray casting against sharp hex polygon
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];

    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  if (!inside) return false;

  if (cornerRadius <= 0) return true;

  // Phase 2: Corner arc refinement
  const r = clampHexRadius(vertices, cornerRadius);

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    const { d } = computeTangentPoints(curr, prev, next, r);

    // Unit vectors along edges from vertex
    const toPrev = normalize(vectorBetween(curr, prev));
    const toNext = normalize(vectorBetween(curr, next));

    // Check if point is in the corner region
    const relX = px - curr[0];
    const relY = py - curr[1];
    const projPrev = relX * toPrev[0] + relY * toPrev[1];
    const projNext = relX * toNext[0] + relY * toNext[1];

    if (projPrev < d && projPrev >= 0 && projNext < d && projNext >= 0) {
      // Arc center is along the bisector at distance r / sin(halfAngle) from vertex
      const bisX = toPrev[0] + toNext[0];
      const bisY = toPrev[1] + toNext[1];
      const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);

      if (bisLen > 1e-10) {
        const cosAngle = Math.max(-1, Math.min(1, toPrev[0] * toNext[0] + toPrev[1] * toNext[1]));
        const halfAngle = Math.acos(cosAngle) / 2;
        const sinHalf = Math.sin(halfAngle);
        const arcCenterDist = sinHalf > 1e-10 ? r / sinHalf : r;

        const arcCenterX = curr[0] + (bisX / bisLen) * arcCenterDist;
        const arcCenterY = curr[1] + (bisY / bisLen) * arcCenterDist;

        const dx = px - arcCenterX;
        const dy = py - arcCenterY;

        if (dx * dx + dy * dy > r * r) return false;
      }
    }
  }

  return true;
};

// ── ShapeGenerator implementation ───────────────────────────────────────────

export const hexagonShape: ShapeGenerator = {
  drawClipPath(ctx, width, height, cornerRadius = 0) {
    const vertices = computeHexVertices(width, height, 0, 0);
    const n = vertices.length;

    ctx.beginPath();

    if (cornerRadius > 0) {
      const r = clampHexRadius(vertices, cornerRadius);
      const { toNext } = computeTangentPoints(vertices[0], vertices[n - 1], vertices[1], r);

      ctx.moveTo(toNext[0], toNext[1]);

      for (let i = 1; i <= n; i++) {
        const curr = vertices[i % n];
        const next = vertices[(i + 1) % n];

        ctx.arcTo(curr[0], curr[1], next[0], next[1], r);
      }
    } else {
      ctx.moveTo(vertices[0][0], vertices[0][1]);

      for (let i = 1; i < n; i++) {
        ctx.lineTo(vertices[i][0], vertices[i][1]);
      }
    }

    ctx.closePath();
  },

  generateBorderPath: (options) => createExpandedBorderPath(generateHexPath, options),

  generatePath: generateHexPath,

  getMetadata(input: MetadataInput): ShapeMetadata {
    const gridH = input.rows * input.pieceSize;
    const puzzleRadius = input.radius ?? 0;

    return {
      borderCornerRadius: input.border.radius,
      boundaryCornerRadius: puzzleRadius,
      boundaryHeight: gridH,
      centerYOffset: 0,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: puzzleRadius,
    };
  },

  isPointInside(x, y, width, height, cornerRadius = 0) {
    return isPointInHex(x, y, width, height, cornerRadius);
  },
};
