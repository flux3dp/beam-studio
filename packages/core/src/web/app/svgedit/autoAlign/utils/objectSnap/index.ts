import type { MinAreaRect } from '../getMinAreaRect';

/** Snap to object center engages within this many screen px of the object's centre, so zooming in tightens it. */
export const OBJECT_SNAP_SCREEN_PX = 20;

/** polygon area / min-area-rect area above which an object counts as a rectangle (tile with ragged mask: 0.86, star: 0.47) */
export const RECTANGULAR_MIN = 0.8;

/** while rotating, snap to an object's edge direction when within this many degrees */
export const ROTATION_SNAP_DEG = 3;

/** wrap to [-180, 180) */
export const wrapDeg = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

export interface RotationCandidate {
  /** deg, svgedit convention (clockwise on screen), in [-180, 180) */
  angle: number;
  /** half the object extent along this direction, for the guide line */
  halfLength: number;
}

/**
 * Rotation angles at which a design whose long edge is horizontal lines up with a detected rectangular
 * object: parallel to its long edge, its short edge, and for near-square objects its diagonals too.
 * `rect.angle` is the object's long-edge direction in rad, in (-π/2, π/2].
 */
export const getRotationCandidates = (rect: MinAreaRect): RotationCandidate[] => {
  const { angle, height, width } = rect;
  const base = (angle * 180) / Math.PI;
  const long = { halfLength: width / 2, step: 0 };
  const short = { halfLength: height / 2, step: 90 };
  const diagonal = Math.hypot(width, height) / 2;
  const options =
    width / height <= 1.1
      ? [long, { halfLength: diagonal, step: 45 }, short, { halfLength: diagonal, step: 135 }]
      : [long, short];

  return options.flatMap(({ halfLength, step }) => [
    { angle: wrapDeg(base + step), halfLength },
    { angle: wrapDeg(base + step + 180), halfLength },
  ]);
};

/** Path of a segment through (cx, cy) along `angle` (rad), `half` long on each side. */
export const axisPath = (cx: number, cy: number, angle: number, half: number): string => {
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;

  return `M ${cx - dx} ${cy - dy} L ${cx + dx} ${cy + dy}`;
};
