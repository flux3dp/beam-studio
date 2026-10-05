import { dpmm } from '@core/app/actions/beambox/constant';
import workareaManager from '@core/app/svgedit/workarea';

import type { BBox } from '../store';
import type { Point } from '../utils/rigidTransform';

/** Side of the square content box the sheet is laid out around, in mm: holds SCALE_START_MM + the longest line + its label on each side */
export const BOX_SIZE_MM = 80;
/** Number of scale lines per axis (odd, so a middle line exists); 41 × 0.05 mm = ±1 mm range */
export const SCALE_LINE_COUNT = 41;
/** Printed scale pitch, in mm */
export const PRINTED_PITCH_MM = 1;
/** Offset resolution one vernier index stands for, in mm */
export const READING_STEP_MM = 0.05;
/** Laser-scratched vernier pitch, in mm: one printed pitch minus the reading resolution */
export const SCRATCH_PITCH_MM = PRINTED_PITCH_MM - READING_STEP_MM;
/** Half the line count: readings run from -HALF to +HALF */
export const READING_MAX = (SCALE_LINE_COUNT - 1) / 2;

/** Gap between a scale's start and the other scale's outermost line, in mm, so the two scales never cross */
const SCALE_GAP_MM = 2;

/** Distance from the box center to where the printed scales start, in mm */
export const SCALE_START_MM = READING_MAX * PRINTED_PITCH_MM + SCALE_GAP_MM;
/** Length of a printed scale line, in mm (longer for the middle and every 5th line) */
export const PRINTED_LINE_MM = 8;
/** Length of a scratched vernier line, in mm; it ends where the printed scale starts */
export const SCRATCH_LINE_MM = 6;

export interface Segment {
  from: Point;
  to: Point;
}

/** Content box in canvas px, centered on the machine bed */
export const getCalibrationBBox = (): BBox => {
  const size = BOX_SIZE_MM * dpmm;

  return {
    height: size,
    width: size,
    x: (workareaManager.width - size) / 2,
    y: (workareaManager.modelHeight - size) / 2,
  };
};

export const getBoxCenter = (bbox: BBox): Point => ({ x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 });

/**
 * Shift of each scale's zero along its own axis, in mm: the x scale sits to
 * the left of the box center, the y scale above it, so the scratched combs
 * (which reach inward from SCALE_START_MM) can never cross each other —
 * crossing combs cut a grid that drops a piece out of the paper.
 */
export const SCALE_SHIFT_MM = 12;

export type ScaleAxis = 'x' | 'y';

export const toSheetPoint = (bbox: BBox, axis: ScaleAxis, uMm: number, vMm: number): Point => {
  const c = getBoxCenter(bbox);

  return axis === 'x'
    ? { x: c.x + (uMm - SCALE_SHIFT_MM) * dpmm, y: c.y + vMm * dpmm }
    : { x: c.x + vMm * dpmm, y: c.y + (uMm - SCALE_SHIFT_MM) * dpmm };
};

const indices = Array.from({ length: SCALE_LINE_COUNT }, (_, i) => i - READING_MAX);

/** Line length multiplier: the middle line and every 5th line are longer so a reading can be counted at a glance */
export const lengthFactor = (index: number): number => (index === 0 ? 1.5 : index % 5 === 0 ? 1.25 : 1);

export type ScaleKind = 'printed' | 'scratch';

/**
 * What tells the two line trains of a scale apart: the printed scale grows
 * outward from SCALE_START_MM at the printed pitch, the laser-scratched
 * vernier comb reaches inward from it at the vernier pitch.
 */
const SCALE_KINDS: Record<ScaleKind, { direction: -1 | 1; lineMm: number; pitchMm: number }> = {
  printed: { direction: 1, lineMm: PRINTED_LINE_MM, pitchMm: PRINTED_PITCH_MM },
  scratch: { direction: -1, lineMm: SCRATCH_LINE_MM, pitchMm: SCRATCH_PITCH_MM },
};

/**
 * One line train of both axes in canvas px, at its designed (unaligned)
 * position: the x scale (vertical lines) below the box center, the y scale
 * (horizontal lines) to its right. Lines follow the length pattern (middle
 * 1.5×, every 5th 1.25×) so matching printed/scratched pairs are easy to spot.
 */
export const getScaleSegments = (bbox: BBox, kind: ScaleKind): Segment[] => {
  const { direction, lineMm, pitchMm } = SCALE_KINDS[kind];

  return (['x', 'y'] as const).flatMap((axis) =>
    indices.map((index) => {
      const u = index * pitchMm;
      const far = SCALE_START_MM + direction * lengthFactor(index) * lineMm;

      return {
        from: toSheetPoint(bbox, axis, u, Math.min(far, SCALE_START_MM)),
        to: toSheetPoint(bbox, axis, u, Math.max(far, SCALE_START_MM)),
      };
    }),
  );
};

/** Scale index labels (printed at every 5th line) with the canvas px position of their line's far end */
export const getPrintedScaleLabels = (bbox: BBox): Array<{ index: number; x: Point; y: Point }> => {
  const end = SCALE_START_MM + PRINTED_LINE_MM * 1.5 + 2;

  return indices
    .filter((index) => index % 5 === 0)
    .map((index) => {
      const u = index * PRINTED_PITCH_MM;

      return { index, x: toSheetPoint(bbox, 'x', u, end), y: toSheetPoint(bbox, 'y', u, end) };
    });
};
