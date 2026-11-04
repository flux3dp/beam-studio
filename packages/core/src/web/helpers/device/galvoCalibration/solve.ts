import type { GalvoConfig, GalvoGridCorrection } from '../galvoConfig';
import {
  COUPON_GRID,
  COUPON_PITCH,
  couponFeatures,
  DISCOVERY_ARM,
  IDENTITY_CENTER,
  IDENTITY_RADIUS,
  L_FRAME,
  NODE_ARM,
  NODE_RADIUS,
} from '../galvoCoupon';

import type { CapturedCoupon } from './captureGrid';
import { toCanvasPx } from './captureGrid';

/**
 * The solving half: what fluxghost's `solve_galvo_coupon` is told about the picture, what it
 * answers, and how the answer turns into the next scaleX / scaleY to try.
 */

/** Everything the solver needs to know about the picture and the pattern (PRD §7.8). */
export interface SolveParams {
  annotate: boolean;
  arm: [number, number];
  discovery: Array<[number, number]>;
  /** Where the lens centre is in the image, px. */
  expected_center_px: [number, number];
  grid: number;
  /** The field the proposed grid correction table spans, mm: the lens's, not the coupon's. */
  grid_field: number;
  /** Points per axis of the proposed grid correction table. */
  grid_size: number;
  identity: [number, number];
  identity_r: number;
  /** The axis mirroring the card applies, as a first guess at which way the pattern lies. */
  invert: [boolean, boolean];
  l_frame: { arm: number; half: number };
  /** Find the coupon first; px_per_mm and expected_center_px are then only a starting point. */
  locate?: boolean;
  node_r: number;
  pitch: number;
  px_per_mm: number;
  /** 'auto' tries the four ways up and keeps the one whose identity ring lands where it belongs. */
  rotate?: 'auto' | 'none';
  /** 'affine' for a stitched capture; 'auto' lets a hand-held photograph's perspective through. */
  ruler_model?: 'affine' | 'auto' | 'projective';
  validation: Array<[number, number]>;
}

export const buildSolveParams = (
  captured: CapturedCoupon,
  config: GalvoConfig,
  {
    annotate = true,
    center,
    photograph = false,
  }: {
    annotate?: boolean;
    center: { x: number; y: number };
    /** The image is a photograph from elsewhere, of unknown scale and perspective, not a capture. */
    photograph?: boolean;
  },
): SolveParams => {
  const centerPx = toCanvasPx(center, captured.originMm, captured.pxPerMm);
  const of = (kind: 'discovery' | 'validation'): Array<[number, number]> =>
    couponFeatures.filter((f) => f.kind === kind).map(({ x, y }) => [x, y]);

  return {
    annotate,
    arm: [...NODE_ARM],
    discovery: of('discovery'),
    expected_center_px: [centerPx.x, centerPx.y],
    grid: COUPON_GRID,
    grid_field: config.workarea,
    grid_size: GRID_TABLE_SIZE,
    identity: [IDENTITY_CENTER.x, IDENTITY_CENTER.y],
    identity_r: IDENTITY_RADIUS,
    invert: [Boolean(config.field.invertX), Boolean(config.field.invertY)],
    l_frame: { arm: L_FRAME.arm, half: L_FRAME.half },
    node_r: NODE_RADIUS,
    pitch: COUPON_PITCH,
    px_per_mm: captured.pxPerMm,
    validation: of('validation'),
    ...(photograph ? { locate: true, rotate: 'auto' as const, ruler_model: 'auto' as const } : {}),
  };
};

/** `DISCOVERY_ARM` is not sent: the solver finds those marks from the nodes, it never measures them. */
export const discoveryArm = DISCOVERY_ARM;

export interface SolveRuler {
  /** 'affine' or 'projective': what the ruler was fitted as. */
  model?: string;
  px_per_mm_x: number;
  px_per_mm_y: number;
  rms_mm: number;
  vertices_used: number;
}

/** What the solver answers on success (PRD §7.9); a quantity it could not measure is null. */
export interface SolveResult {
  affine_max: null | number;
  affine_rms: null | number;
  /** The lens centre in the L frame's coordinates, mm relative to the designed centre. */
  field_center_mm: [number, number] | null;
  /**
   * The proposed grid correction table: where each point of the card's grid lands minus where it
   * was commanded, with translation and rotation taken out. Absent from an older fluxghost, null
   * with too few nodes to fit.
   */
  grid?: null | SolveGrid;
  /** Where the solver found the coupon when asked to locate it (a photograph). */
  located?: null | { center_px: [number, number]; px_per_mm: number };
  /** The affine map turned the pattern over (det < 0): an axis is mirrored relative to the guess. */
  mirrored?: boolean;
  nodes_found: number;
  orientation?: { identity_distance_mm: null | number; matches_invert: boolean; source: 'identity' | 'invert' };
  raw_max: null | number;
  raw_rms: null | number;
  /** How the image was turned before solving, degrees clockwise; 0 unless `rotate: 'auto'` turned it. */
  rotated_deg?: number;
  /** The galvo axes' angle relative to the L frame, degrees; what field.angle would take out. */
  rotation_deg?: null | number;
  ruler: SolveRuler;
  scale_x: null | number;
  scale_y: null | number;
  skew_deg: null | number;
  validation_affine: null | number;
  validation_bilinear: null | number;
}

export interface SolveGrid {
  dx: number[];
  dy: number[];
  /** Grid points outside the coupon's nodes, whose values the cubic extrapolates. */
  extrapolated: number;
  field: number;
  fit_max_mm: null | number;
  fit_rms_mm: null | number;
  size: number;
}

export const GRID_TABLE_SIZE = 9;

/**
 * +1: the card's "actual" coordinates are where a commanded point lands, which is what the solver
 * measures. Settled 2026-11-04 (PRD galvo-grid-correction.md decision 1): a table of
 * actual = theory x (100 / scale) brought a coupon back to its size, scale 1.007 / 0.990.
 */
export const GRID_SIGN: -1 | 1 = 1;

// || 0: a -0 from a negative coordinate times a zero scale reads as noise in the stored JSON
const round4 = (value: number): number => Math.round(value * 1e4) / 1e4 || 0;

/**
 * The table that stands in for the manual scales. A loaded table makes the card drop the eight
 * manual coefficients and the scanahead inversion (probe, 2026-11-04), so the first table is the
 * scale those coefficients carried, 100 / scale on each axis -- the rest of what they did (barrel,
 * trapezoid, ...) is what the next coupon measures.
 */
export const scaleGridCorrection = (
  config: Pick<GalvoConfig, 'field' | 'galvoParameters' | 'workarea'>,
  size = GRID_TABLE_SIZE,
): Pick<GalvoGridCorrection, 'dx' | 'dy' | 'field' | 'size'> => {
  const field = config.workarea;
  const sx = 100 / config.galvoParameters.x.scale - 1;
  const sy = 100 / config.galvoParameters.y.scale - 1;
  const dx: number[] = [];
  const dy: number[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      dx.push(round4((-field / 2 + (col * field) / (size - 1)) * sx));
      dy.push(round4((-field / 2 + (row * field) / (size - 1)) * sy));
    }
  }

  return { dx, dy, field, size };
};

/**
 * The table to apply after a coupon marked with `marked` (the table the machine held then; null
 * or absent for none) measured `measured`.
 *
 * With a table in force the measurement is what that table leaves, so it adds to it: to first
 * order the card's model of the field becomes the field. A coupon marked WITHOUT a table was
 * marked through the manual coefficients, which a table switches off, so its measurement says
 * nothing about the field a table works on: the result is then the scale table alone
 * (`fromScales`), to be marked and solved before anything is added. A table of a different size
 * or field cannot be added to either and is treated the same way.
 *
 * The axis flags are the head's own, from `config.field`: the card takes them from the table's
 * parameters once one is loaded, not from the scanahead it otherwise uses.
 */
export const composeGridCorrection = (
  marked: GalvoGridCorrection | null | undefined,
  measured: SolveGrid,
  config: Pick<GalvoConfig, 'field' | 'galvoParameters' | 'workarea'>,
  createdAt = new Date().toISOString(),
): { fromScales: boolean; grid: GalvoGridCorrection } => {
  const base = marked && marked.size === measured.size && marked.field === measured.field ? marked : null;
  const flags = {
    ...(config.field.swapXY ? { flip: true } : {}),
    ...(config.field.invertX ? { invertX: true } : {}),
    ...(config.field.invertY ? { invertY: true } : {}),
  };

  if (!base) {
    return { fromScales: true, grid: { createdAt, ...scaleGridCorrection(config, measured.size), ...flags } };
  }

  const add = (from: number[], d: number[]) => d.map((v, i) => round4((from[i] ?? 0) + GRID_SIGN * v));

  return {
    fromScales: false,
    grid: {
      createdAt,
      dx: add(base.dx, measured.dx),
      dy: add(base.dy, measured.dy),
      field: measured.field,
      ...(measured.fit_rms_mm === null ? {} : { fitRmsMm: measured.fit_rms_mm }),
      ...flags,
      size: measured.size,
    },
  };
};

/** The largest displacement in a table, mm: a one-glance size for the settings to show. */
export const gridMaxShift = (grid: Pick<GalvoGridCorrection, 'dx' | 'dy'>): number =>
  grid.dx.reduce((max, dx, i) => Math.max(max, Math.hypot(dx, grid.dy[i] ?? 0)), 0);

/** One marked-and-solved coupon, for the secant estimate of the next round. */
export interface CalibrationRound {
  measured: Pick<SolveResult, 'affine_rms' | 'scale_x' | 'scale_y' | 'skew_deg'>;
  /** The scale values the coupon was marked with. */
  sent: { scaleX: number; scaleY: number };
}

/**
 * How much the measured X scale moves per unit of the card's scaleX, measured by the factory on
 * the CO2 head's 110 lens over three points and found linear. The Y encoding on the card is not
 * known (the factory's prediction of 94.98 converged at 79.3), so Y borrows this for the first
 * round and uses the secant of its own history after that.
 */
export const SCALE_X_SLOPE = 0.007753;

/** A secant slope outside this range is noise, not a slope. */
const SLOPE_RANGE: [number, number] = [0.001, 0.1];

export interface ScaleSuggestion {
  scaleX: null | number;
  scaleY: null | number;
  slopeY: number;
  slopeYSource: 'borrowed' | 'secant';
}

const roundScale = (value: number): number => Math.round(value * 100) / 100;

/**
 * The next scaleX / scaleY to mark with, from this round's measurement and the rounds before it.
 * A scale the solver could not measure gets no suggestion.
 */
export const suggestScales = (round: CalibrationRound, history: CalibrationRound[]): ScaleSuggestion => {
  const { measured, sent } = round;
  const scaleX = measured.scale_x === null ? null : roundScale(sent.scaleX - (measured.scale_x - 1) / SCALE_X_SLOPE);

  let slopeY = SCALE_X_SLOPE;
  let slopeYSource: ScaleSuggestion['slopeYSource'] = 'borrowed';
  const previous = [...history].reverse().find((r) => r.sent.scaleY !== sent.scaleY && r.measured.scale_y !== null);

  if (previous && measured.scale_y !== null) {
    const slope = (measured.scale_y - previous.measured.scale_y!) / (sent.scaleY - previous.sent.scaleY);

    if (Number.isFinite(slope) && slope >= SLOPE_RANGE[0] && slope <= SLOPE_RANGE[1]) {
      slopeY = slope;
      slopeYSource = 'secant';
    }
  }

  const scaleY = measured.scale_y === null ? null : roundScale(sent.scaleY - (measured.scale_y - 1) / slopeY);

  return { scaleX, scaleY, slopeY, slopeYSource };
};
