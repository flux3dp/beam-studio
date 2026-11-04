import type { GalvoFieldCorrection } from './galvoConfig';
import type { GalvoPoint } from './galvoExec';

/**
 * Pre-distortion of galvo field coordinates, the TypeScript twin of swiftray's
 * `galvo-field-correction.h` (PRD docs/prd/hexa-ii-galvo/galvo-grid-correction.md). Swiftray applies
 * it to every job; this applies it to what Beam Studio marks on its own through the control task
 * -- the calibration coupon above all, which has to be marked the way a job would be for the next
 * round's measurement to mean anything.
 *
 * The table is the field's displacement D (where a point commanded at c lands, minus c) on a
 * size x size grid over +-field/2, row-major from (-field/2, -field/2), X fastest. To land at c the
 * beam is aimed at the c' that solves c' + D(c') = c. Both sides must give the same c', so the
 * interpolation (bilinear, the edge cells' planes carried on outside the grid) and the three
 * fixed-point rounds are the same as swiftray's.
 */

/** The longest straight piece a corrected mark may span, mm; swiftray's kCorrectedPieceMm. */
export const CORRECTED_PIECE_MM = 4;

export const isFieldCorrectionUsable = (correction: GalvoFieldCorrection | null | undefined): boolean =>
  Boolean(
    correction &&
      correction.size >= 2 &&
      correction.field > 0 &&
      correction.dx.length === correction.size ** 2 &&
      correction.dy.length === correction.size ** 2,
  );

export const fieldDisplacement = (correction: GalvoFieldCorrection, { x, y }: GalvoPoint): GalvoPoint => {
  const { dx, dy, field, size } = correction;
  const step = field / (size - 1);
  const fx = (x + field / 2) / step;
  const fy = (y + field / 2) / step;
  const i = Math.min(Math.max(Math.floor(fx), 0), size - 2);
  const j = Math.min(Math.max(Math.floor(fy), 0), size - 2);
  const u = fx - i;
  const v = fy - j;
  const lerp = (d: number[]) =>
    (1 - u) * (1 - v) * d[j * size + i] +
    u * (1 - v) * d[j * size + i + 1] +
    (1 - u) * v * d[(j + 1) * size + i] +
    u * v * d[(j + 1) * size + i + 1];

  return { x: lerp(dx), y: lerp(dy) };
};

/** Where to aim for the beam to land at `target`. Unchanged without a usable correction. */
export const predistort = (correction: GalvoFieldCorrection | null | undefined, target: GalvoPoint): GalvoPoint => {
  if (!correction || !isFieldCorrectionUsable(correction)) return target;

  let q = target;

  for (let k = 0; k < 3; k += 1) {
    const d = fieldDisplacement(correction, q);

    q = { x: target.x - d.x, y: target.y - d.y };
  }

  return q;
};

/**
 * A polyline as it has to be sent: every straight segment cut into pieces of at most
 * CORRECTED_PIECE_MM, since the correction bends it, and every point pre-distorted.
 */
export const predistortPath = (
  correction: GalvoFieldCorrection | null | undefined,
  path: GalvoPoint[],
): GalvoPoint[] => {
  if (!correction || !isFieldCorrectionUsable(correction) || path.length === 0) return path;

  const out: GalvoPoint[] = [predistort(correction, path[0])];

  for (let s = 1; s < path.length; s += 1) {
    const a = path[s - 1];
    const b = path[s];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / CORRECTED_PIECE_MM));

    for (let k = 1; k <= n; k += 1) {
      out.push(predistort(correction, { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n }));
    }
  }

  return out;
};
