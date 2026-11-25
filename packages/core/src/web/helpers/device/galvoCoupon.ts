import { match } from 'ts-pattern';

import type { GalvoWorkarea } from './galvoConfig';
import type { GalvoPoint } from './galvoExec';

/**
 * The field-lens calibration coupon, transcribed from the factory procedure ("HX2 場鏡校正操作
 * 流程", 2026-10-27) so that what the galvo marks here is what the factory's solver expects.
 *
 * Coordinates are galvo field mm with the lens centre as origin, +X right and +Y down, the same
 * convention as galvoExec. Every stroke is listed in the direction it is marked; the 2 mm lead-in
 * and lead-out of each stroke (the "roll") is added on the machine from `lead_mm`, so nothing here
 * includes it. See docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md §7.2.
 *
 * The factory's coupon is for the 110 mm lens. A smaller lens gets the same marks at the same
 * pitch with fewer nodes, not a shrunken copy: the solver and the camera (5 to 7 px/mm) read
 * rings and arms of this size, and would not read smaller ones.
 */

/** Grid pitch, mm, for every lens. */
export const COUPON_PITCH = 11;
/**
 * Nodes per axis for each lens: the most that keep the whole coupon, lead included, inside the
 * field. 110 is the factory's 9 (nodes from -44 to +44); 90 reaches +-33 and 70 +-22.
 */
export const COUPON_GRID_BY_FIELD = { 70: 5, 90: 7, 110: 9 } as const satisfies Record<GalvoWorkarea, number>;
/** Radius of the ring every node and validation mark is drawn as. */
export const NODE_RADIUS = 1.25;
/** The node's four arms run from the inner to the outer radius, mm from the node centre. */
export const NODE_ARM: readonly [number, number] = [2.0, 4.5];
/** The discovery marks' diagonal arms, inner to outer radius. */
export const DISCOVERY_ARM: readonly [number, number] = [1.5, 3.5];
export const IDENTITY_RADIUS = 0.5;
/** Lead-in / lead-out added to every stroke by the machine, mm. */
export const COUPON_LEAD_MM = 2;

/** Segments every ring is drawn with. */
const RING_SEGMENTS = 36;

export type CouponFeatureKind = 'discovery' | 'identity' | 'node' | 'validation';

export interface CouponFeature extends GalvoPoint {
  kind: CouponFeatureKind;
}

/**
 * Side of the square a lens is tiled with, mm: swiftray's block for it (get_galvo_block_size),
 * 100 for the 110 lens, 80 for 90 and 60 for 70. The calibration's square and stitch test mark it.
 */
export const galvoBlockMm = (field: GalvoWorkarea): number => field - 10;

const signPairs: Array<[number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

export interface CouponLayout {
  /** Every feature with its designed centre, in marking order: the solver's expected positions. */
  features: ReadonlyArray<CouponFeature>;
  /** Nodes per axis. */
  grid: number;
  /** The outermost node row and column, mm from the lens centre. */
  half: number;
  /** The lone small ring that tells the solver which corner is which. */
  identity: GalvoPoint;
}

/** The coupon for a lens of `field` mm; 110 gives the factory's. */
export const couponLayout = (field: GalvoWorkarea): CouponLayout => {
  const grid = COUPON_GRID_BY_FIELD[field];
  const half = ((grid - 1) / 2) * COUPON_PITCH;
  const gridAxis = Array.from({ length: grid }, (_, i) => i * COUPON_PITCH - half);
  /**
   * Nodes row by row from y = -half, boustrophedon: even rows -X to +X, odd rows back. The order
   * is part of the factory spec (it decides which node is marked first and which last).
   */
  const nodes: GalvoPoint[] = gridAxis.flatMap((y, row) =>
    (row % 2 === 0 ? gridAxis : [...gridAxis].reverse()).map((x) => ({ x, y })),
  );
  // half a pitch off the lattice, so nothing here is taken for a node
  const inner = COUPON_PITCH / 2;
  const outer = half + inner;
  /** 12 X-shaped marks near the corners and the axis crossings of the outer ring. */
  const discovery: GalvoPoint[] = [
    ...signPairs.map(([sx, sy]) => ({ x: outer * sx, y: outer * sy })),
    ...signPairs.map(([sx, sy]) => ({ x: inner * sx, y: outer * sy })),
    ...signPairs.map(([sx, sy]) => ({ x: outer * sx, y: inner * sy })),
  ];
  // the second set sits about half way out: +-27.5 of the factory's +-44, +-16.5 on a smaller grid
  const mid = inner + COUPON_PITCH * Math.floor((grid - 1) / 4);
  /** 8 rings that are measured but kept out of the fit, to report interpolation error. */
  const validation: GalvoPoint[] = [
    ...signPairs.map(([sx, sy]) => ({ x: inner * sx, y: inner * sy })),
    ...signPairs.map(([sx, sy]) => ({ x: mid * sx, y: mid * sy })),
  ];
  /**
   * Above the first node, just outside the block's square, which the calibration marks on the
   * same sheet. The factory's (-44, -51) on the 110 lens is 1 mm outside it, which leaves 0.5 mm
   * between ring and square: they can run together, and the solver then falls back on the invert
   * flags. A smaller lens has no factory layout to keep, so its ring sits 2 mm outside.
   */
  const identity: GalvoPoint = { x: -half, y: -(galvoBlockMm(field) / 2 + (field === 110 ? 1 : 2)) };

  return {
    features: [
      ...nodes.map((p) => ({ ...p, kind: 'node' as const })),
      ...discovery.map((p) => ({ ...p, kind: 'discovery' as const })),
      ...validation.map((p) => ({ ...p, kind: 'validation' as const })),
      { ...identity, kind: 'identity' },
    ],
    grid,
    half,
    identity,
  };
};

const round = (value: number): number => Math.round(value * 1e4) / 1e4;

/**
 * A closed ring as a 36-gon. Starts at the -Y end of the circle and the first segment heads
 * toward +X, as the factory's generator does, so the lead-in and lead-out both lie along +X.
 */
const ring = (center: GalvoPoint, radius: number): GalvoPoint[] =>
  Array.from({ length: RING_SEGMENTS + 1 }, (_, k) => {
    const phi = (k * 2 * Math.PI) / RING_SEGMENTS;

    return { x: round(center.x + radius * Math.sin(phi)), y: round(center.y - radius * Math.cos(phi)) };
  });

const segment = (from: GalvoPoint, to: GalvoPoint): GalvoPoint[] => [
  { x: round(from.x), y: round(from.y) },
  { x: round(to.x), y: round(to.y) },
];

/** Ring plus four arms, every arm marked toward +X or +Y. */
const nodeStrokes = ({ x, y }: GalvoPoint): GalvoPoint[][] => {
  const [inner, outer] = NODE_ARM;

  return [
    ring({ x, y }, NODE_RADIUS),
    segment({ x: x - outer, y }, { x: x - inner, y }),
    segment({ x: x + inner, y }, { x: x + outer, y }),
    segment({ x, y: y - outer }, { x, y: y - inner }),
    segment({ x, y: y + inner }, { x, y: y + outer }),
  ];
};

/**
 * Four diagonal arms. The two on the (1, 1) diagonal are marked toward (+, +), the two on the
 * (1, -1) diagonal toward (+, -), so each pair shares one direction.
 */
const discoveryStrokes = ({ x, y }: GalvoPoint): GalvoPoint[][] => {
  const [inner, outer] = DISCOVERY_ARM;
  const k = Math.SQRT1_2;

  return [1, -1].flatMap((sy) => {
    const d = { x: k, y: k * sy };

    return [
      segment({ x: x - outer * d.x, y: y - outer * d.y }, { x: x - inner * d.x, y: y - inner * d.y }),
      segment({ x: x + inner * d.x, y: y + inner * d.y }, { x: x + outer * d.x, y: y + outer * d.y }),
    ];
  });
};

/**
 * Every stroke of the coupon as a polyline, in marking order: the nodes (ring + 4 arms each),
 * 12 discovery marks (4 arms each), 8 validation rings, then the identity ring -- 462 in all on
 * the 110 lens's 81 nodes. Pure: the same list every time, with nothing from the machine in it.
 */
export const buildCouponPaths = (field: GalvoWorkarea): GalvoPoint[][] =>
  couponLayout(field).features.flatMap((feature) =>
    match(feature.kind)
      .with('node', () => nodeStrokes(feature))
      .with('discovery', () => discoveryStrokes(feature))
      .with('validation', () => [ring(feature, NODE_RADIUS)])
      .with('identity', () => [ring(feature, IDENTITY_RADIUS)])
      .exhaustive(),
  );

/** How far from the lens centre the coupon reaches once the machine adds the lead, mm. */
export const couponExtentMm = (field: GalvoWorkarea, leadMm = COUPON_LEAD_MM): number => {
  const [, outer] = DISCOVERY_ARM;
  const { half, identity } = couponLayout(field);

  return round(
    Math.max(half + COUPON_PITCH / 2 + (outer + leadMm) * Math.SQRT1_2, Math.abs(identity.y) + IDENTITY_RADIUS),
  );
};

/** The ruler the nozzle cuts around the coupon: 8 L marks on a square of half-side `half`. */
export const L_FRAME = { arm: 8, half: 70 } as const;

export interface LFrameMark {
  /** Where the stroke ends, the end of the arm along Y. */
  end: GalvoPoint;
  /** Where the laser lands first, the end of the arm along X. */
  start: GalvoPoint;
  vertex: GalvoPoint;
}

/**
 * The 8 L marks around a coupon whose field centre lands at `center` (bed mm), each as the
 * stroke X-arm end → vertex → Y-arm end. Corner Ls point both arms at the centre; an L on the
 * middle of an edge points the arm that runs along that edge toward +, the other at the centre.
 * The asymmetry is the factory's, deliberately, and the solver relies on it to tell edges apart.
 */
export const buildLFrameMarks = (center: GalvoPoint): LFrameMark[] => {
  const { arm, half } = L_FRAME;
  const vertices: GalvoPoint[] = [
    { x: -half, y: -half },
    { x: 0, y: -half },
    { x: half, y: -half },
    { x: half, y: 0 },
    { x: half, y: half },
    { x: 0, y: half },
    { x: -half, y: half },
    { x: -half, y: 0 },
  ];

  return vertices.map(({ x: vx, y: vy }) => {
    const xArm = vx === 0 ? arm : -Math.sign(vx) * arm;
    const yArm = vy === 0 ? arm : -Math.sign(vy) * arm;
    const vertex = { x: round(center.x + vx), y: round(center.y + vy) };

    return {
      end: { x: vertex.x, y: round(vertex.y + yArm) },
      start: { x: round(vertex.x + xArm), y: vertex.y },
      vertex,
    };
  });
};
