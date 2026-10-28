import type { GalvoPoint } from './galvoExec';

/**
 * The field-lens calibration coupon, transcribed from the factory procedure ("HX2 場鏡校正操作
 * 流程", 2026-10-27) so that what the galvo marks here is what the factory's solver expects.
 *
 * Coordinates are galvo field mm with the lens centre as origin, +X right and +Y down, the same
 * convention as galvoExec. Every stroke is listed in the direction it is marked; the 2 mm lead-in
 * and lead-out of each stroke (the "roll") is added on the machine from `lead_mm`, so nothing here
 * includes it. See docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md §7.2.
 */

/** Grid pitch, mm: 9 nodes per axis from -44 to +44. */
export const COUPON_PITCH = 11;
export const COUPON_GRID = 9;
/** Radius of the ring every node and validation mark is drawn as. */
export const NODE_RADIUS = 1.25;
/** The node's four arms run from the inner to the outer radius, mm from the node centre. */
export const NODE_ARM: readonly [number, number] = [2.0, 4.5];
/** The discovery marks' diagonal arms, inner to outer radius. */
export const DISCOVERY_ARM: readonly [number, number] = [1.5, 3.5];
/** The lone small ring that tells the solver which corner is which. */
export const IDENTITY_CENTER: GalvoPoint = { x: -44, y: -51 };
export const IDENTITY_RADIUS = 0.5;
/** Lead-in / lead-out added to every stroke by the machine, mm. */
export const COUPON_LEAD_MM = 2;

/** Segments every ring is drawn with. */
const RING_SEGMENTS = 36;

export type CouponFeatureKind = 'discovery' | 'identity' | 'node' | 'validation';

export interface CouponFeature extends GalvoPoint {
  kind: CouponFeatureKind;
}

const gridAxis = Array.from({ length: COUPON_GRID }, (_, i) => (i - (COUPON_GRID - 1) / 2) * COUPON_PITCH);

/**
 * Nodes row by row from y = -44, boustrophedon: even rows -X to +X, odd rows back. The order is
 * part of the factory spec (it decides which node is marked first and which last).
 */
const nodeCenters: GalvoPoint[] = gridAxis.flatMap((y, row) =>
  (row % 2 === 0 ? gridAxis : [...gridAxis].reverse()).map((x) => ({ x, y })),
);

const signPairs: Array<[number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

/** 12 X-shaped marks near the corners and the axis crossings of the outer ring. */
const discoveryCenters: GalvoPoint[] = [
  ...signPairs.map(([sx, sy]) => ({ x: 49.5 * sx, y: 49.5 * sy })),
  ...signPairs.map(([sx, sy]) => ({ x: 5.5 * sx, y: 49.5 * sy })),
  ...signPairs.map(([sx, sy]) => ({ x: 49.5 * sx, y: 5.5 * sy })),
];

/** 8 rings that are measured but kept out of the fit, to report interpolation error. */
const validationCenters: GalvoPoint[] = [
  ...signPairs.map(([sx, sy]) => ({ x: 5.5 * sx, y: 5.5 * sy })),
  ...signPairs.map(([sx, sy]) => ({ x: 27.5 * sx, y: 27.5 * sy })),
];

/** Every feature with its designed centre, in marking order: the solver's expected positions. */
export const couponFeatures: ReadonlyArray<CouponFeature> = [
  ...nodeCenters.map((p) => ({ ...p, kind: 'node' as const })),
  ...discoveryCenters.map((p) => ({ ...p, kind: 'discovery' as const })),
  ...validationCenters.map((p) => ({ ...p, kind: 'validation' as const })),
  { ...IDENTITY_CENTER, kind: 'identity' },
];

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
 * Every stroke of the coupon as a polyline, in marking order: 81 nodes (ring + 4 arms each),
 * 12 discovery marks (4 arms each), 8 validation rings, then the identity ring -- 462 in all.
 * Pure: the same list every time, with nothing from the machine in it.
 */
export const buildCouponPaths = (): GalvoPoint[][] => [
  ...nodeCenters.flatMap(nodeStrokes),
  ...discoveryCenters.flatMap(discoveryStrokes),
  ...validationCenters.map((c) => ring(c, NODE_RADIUS)),
  ring(IDENTITY_CENTER, IDENTITY_RADIUS),
];

/** How far from the lens centre the coupon reaches once the machine adds the lead, mm. */
export const couponExtentMm = (leadMm = COUPON_LEAD_MM): number => {
  const [, outer] = DISCOVERY_ARM;

  return round(49.5 + (outer + leadMm) * Math.SQRT1_2);
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
