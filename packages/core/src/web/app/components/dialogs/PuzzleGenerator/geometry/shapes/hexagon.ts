/**
 * Hexagon shape implementation.
 *
 * Flat-top hexagon stretched to fill grid dimensions.
 * Supports rounded corners with angle-aware arc radius.
 * Uses shared hexUtils for vertex computation and radius clamping.
 */

import type { ShapeMetadata } from '../../types';

import { clampHexRadius, computeHexVertices, computeTangentDistance } from './hexUtils';
import type { BorderOptions, MetadataInput, ShapeGenerator, ShapeOptions } from './types';

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

    const d = computeTangentDistance(curr, prev, next, r);

    // Unit vectors from vertex toward each adjacent vertex
    const toPrevLen = Math.sqrt((prev[0] - curr[0]) ** 2 + (prev[1] - curr[1]) ** 2);
    const toNextLen = Math.sqrt((next[0] - curr[0]) ** 2 + (next[1] - curr[1]) ** 2);

    // Tangent points at distance d from vertex along each edge
    const tangentFromPrev: [number, number] = [
      curr[0] + ((prev[0] - curr[0]) / toPrevLen) * d,
      curr[1] + ((prev[1] - curr[1]) / toPrevLen) * d,
    ];
    const tangentToNext: [number, number] = [
      curr[0] + ((next[0] - curr[0]) / toNextLen) * d,
      curr[1] + ((next[1] - curr[1]) / toNextLen) * d,
    ];

    if (i === 0) {
      parts.push(`M ${f(tangentToNext[0])} ${f(tangentToNext[1])}`);
    } else {
      parts.push(`L ${f(tangentFromPrev[0])} ${f(tangentFromPrev[1])}`);
      parts.push(`A ${f(r)} ${f(r)} 0 0 0 ${f(tangentToNext[0])} ${f(tangentToNext[1])}`);
    }
  }

  // Close: arc around vertex 0
  {
    const prev = vertices[n - 1];
    const curr = vertices[0];
    const next = vertices[1];
    const d = computeTangentDistance(curr, prev, next, r);
    const toPrevLen = Math.sqrt((prev[0] - curr[0]) ** 2 + (prev[1] - curr[1]) ** 2);
    const toNextLen = Math.sqrt((next[0] - curr[0]) ** 2 + (next[1] - curr[1]) ** 2);
    const tangentFromPrev: [number, number] = [
      curr[0] + ((prev[0] - curr[0]) / toPrevLen) * d,
      curr[1] + ((prev[1] - curr[1]) / toPrevLen) * d,
    ];
    const tangentToNext: [number, number] = [
      curr[0] + ((next[0] - curr[0]) / toNextLen) * d,
      curr[1] + ((next[1] - curr[1]) / toNextLen) * d,
    ];

    parts.push(`L ${f(tangentFromPrev[0])} ${f(tangentFromPrev[1])}`);
    parts.push(`A ${f(r)} ${f(r)} 0 0 0 ${f(tangentToNext[0])} ${f(tangentToNext[1])}`);
  }

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

    const d = computeTangentDistance(curr, prev, next, r);

    // Unit vectors along edges from vertex
    const toPrevX = prev[0] - curr[0];
    const toPrevY = prev[1] - curr[1];
    const toPrevLen = Math.sqrt(toPrevX * toPrevX + toPrevY * toPrevY);
    const toNextX = next[0] - curr[0];
    const toNextY = next[1] - curr[1];
    const toNextLen = Math.sqrt(toNextX * toNextX + toNextY * toNextY);

    const uPrevX = toPrevX / toPrevLen;
    const uPrevY = toPrevY / toPrevLen;
    const uNextX = toNextX / toNextLen;
    const uNextY = toNextY / toNextLen;

    // Check if point is in the corner region
    const relX = px - curr[0];
    const relY = py - curr[1];
    const projPrev = relX * uPrevX + relY * uPrevY;
    const projNext = relX * uNextX + relY * uNextY;

    if (projPrev < d && projPrev >= 0 && projNext < d && projNext >= 0) {
      // Arc center is along the bisector at distance r / sin(halfAngle) from vertex
      const bisX = uPrevX + uNextX;
      const bisY = uPrevY + uNextY;
      const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);

      if (bisLen > 1e-10) {
        const cosAngle = Math.max(-1, Math.min(1, uPrevX * uNextX + uPrevY * uNextY));
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

      // Canvas arcTo handles the arc geometry correctly given the arc radius.
      const v0 = vertices[0];
      const v1 = vertices[1];
      const vLast = vertices[n - 1];
      const d0 = computeTangentDistance(v0, vLast, v1, r);
      const toNextLen0 = Math.sqrt((v1[0] - v0[0]) ** 2 + (v1[1] - v0[1]) ** 2);

      ctx.moveTo(v0[0] + ((v1[0] - v0[0]) / toNextLen0) * d0, v0[1] + ((v1[1] - v0[1]) / toNextLen0) * d0);

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

  generateBorderPath(options: BorderOptions): string {
    const { borderWidth, cornerRadius, height, width, ...rest } = options;

    return generateHexPath({
      ...rest,
      cornerRadius,
      height: height + borderWidth * 2,
      width: width + borderWidth * 2,
    });
  },

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
