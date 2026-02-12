/**
 * Hexagon math utilities shared by the hexagon shape module.
 *
 * Provides vertex computation, tangent distance calculation, and radius clamping.
 * Extracting `clampHexRadius` eliminates triple-duplication across generateHexPath,
 * isPointInHex, and drawClipPath.
 */

/** Compute the 6 vertices of a flat-top hexagon centered at (cx, cy) with given width and height. */
export const computeHexVertices = (width: number, height: number, cx: number, cy: number): Array<[number, number]> => {
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

/**
 * Compute the tangent-point distance from a vertex for a given arc radius.
 *
 * For a polygon corner with interior angle θ, an inscribed arc of radius R
 * touches each edge at distance `d = R / tan(θ/2)` from the vertex.
 * At 90° (rectangle) d = R; at 120° (regular hex) d ≈ 1.73·R.
 */
export const computeTangentDistance = (
  curr: [number, number],
  prev: [number, number],
  next: [number, number],
  arcRadius: number,
): number => {
  const v1x = prev[0] - curr[0];
  const v1y = prev[1] - curr[1];
  const v2x = next[0] - curr[0];
  const v2y = next[1] - curr[1];
  const dot = v1x * v2x + v1y * v2y;
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
  const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  const halfAngle = Math.acos(cosAngle) / 2; // half of interior angle

  // d = R / tan(halfAngle)
  const tanHalf = Math.tan(halfAngle);

  return tanHalf > 1e-10 ? arcRadius / tanHalf : arcRadius;
};

/**
 * Clamp the arc radius for hex corners so tangent distances don't exceed half-edge lengths.
 *
 * This was previously duplicated inline in generateHexPath, isPointInHex, and drawClipPath.
 */
export const clampHexRadius = (vertices: Array<[number, number]>, cornerRadius: number): number => {
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
