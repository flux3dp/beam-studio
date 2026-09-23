import type { MinAreaRect } from '../getMinAreaRect';

/** Snap to object center engages within this many screen px of the object's centre, so zooming in tightens it. */
export const OBJECT_SNAP_SCREEN_PX = 20;

/** polygon area / min-area-rect area above which an object counts as a rectangle (tile with ragged mask: 0.86, star: 0.47) */
export const RECTANGULAR_MIN = 0.8;

/** while rotating, snap to an object's edge direction when within this many degrees */
export const ROTATION_SNAP_DEG = 3;

/** wrap to [-180, 180) */
export const wrapDeg = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * Rotation angles (deg, svgedit convention: clockwise on screen, 0 = design's long edge horizontal) at
 * which a design would line up with a detected rectangular object described by `rect`.
 * `rect.angle` is the object's long-edge direction in rad, in (-π/2, π/2].
 */
export const getRotationCandidates = (rect: MinAreaRect): number[] => {
  const { angle, height, width } = rect;

  const options = width / height <= 1.1 ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 90, 180, 270];

  const base = (angle * 180) / Math.PI;

  return options.map((r) => wrapDeg(base + r));
};

/** Path of a segment through (cx, cy) along `angle` (rad), `half` long on each side. */
export const axisPath = (cx: number, cy: number, angle: number, half: number): string => {
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;

  return `M ${cx - dx} ${cy - dy} L ${cx + dx} ${cy + dy}`;
};
