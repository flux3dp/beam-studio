import {
  buildCouponPaths,
  buildLFrameMarks,
  COUPON_LEAD_MM,
  couponExtentMm,
  couponFeatures,
  IDENTITY_CENTER,
  L_FRAME,
} from './galvoCoupon';

describe('galvoCoupon', () => {
  const paths = buildCouponPaths();

  it('has one polyline per stroke: 81 nodes × 5, 12 discovery × 4, 8 validation, 1 identity', () => {
    expect(paths).toHaveLength(81 * 5 + 12 * 4 + 8 + 1);
    expect(couponFeatures).toHaveLength(81 + 12 + 8 + 1);
    expect(couponFeatures.filter(({ kind }) => kind === 'node')).toHaveLength(81);
    expect(couponFeatures.filter(({ kind }) => kind === 'discovery')).toHaveLength(12);
    expect(couponFeatures.filter(({ kind }) => kind === 'validation')).toHaveLength(8);
    expect(couponFeatures.at(-1)).toEqual({ ...IDENTITY_CENTER, kind: 'identity' });
  });

  it('starts with the ring of the (-44, -44) node, from its -Y end heading +X', () => {
    const ring = paths[0];

    expect(ring).toHaveLength(37);
    expect(ring[0]).toEqual({ x: -44, y: -45.25 });
    expect(ring[1].x).toBeGreaterThan(ring[0].x);
    expect(ring[1].y).toBeGreaterThan(ring[0].y);
    expect(ring[36]).toEqual(ring[0]);
  });

  it('walks the node rows boustrophedon', () => {
    const nodes = couponFeatures.filter(({ kind }) => kind === 'node');

    expect(nodes[0]).toMatchObject({ x: -44, y: -44 });
    expect(nodes[8]).toMatchObject({ x: 44, y: -44 });
    expect(nodes[9]).toMatchObject({ x: 44, y: -33 });
    expect(nodes[17]).toMatchObject({ x: -44, y: -33 });
    // 9 rows: the last row is an even one, so it runs -X to +X again
    expect(nodes[72]).toMatchObject({ x: -44, y: 44 });
    expect(nodes[80]).toMatchObject({ x: 44, y: 44 });
  });

  it('marks every node arm toward +X or +Y, from the inner radius to the outer', () => {
    const [, left, right, up, down] = paths;

    expect(left).toEqual([
      { x: -48.5, y: -44 },
      { x: -46, y: -44 },
    ]);
    expect(right).toEqual([
      { x: -42, y: -44 },
      { x: -39.5, y: -44 },
    ]);
    expect(up).toEqual([
      { x: -44, y: -48.5 },
      { x: -44, y: -46 },
    ]);
    expect(down).toEqual([
      { x: -44, y: -42 },
      { x: -44, y: -39.5 },
    ]);
  });

  it('marks the discovery arms along their diagonal, (+,+) on one and (+,-) on the other', () => {
    const firstDiscovery = paths.slice(81 * 5, 81 * 5 + 4);
    const direction = ([a, b]: Array<{ x: number; y: number }>) => [Math.sign(b.x - a.x), Math.sign(b.y - a.y)];

    expect(direction(firstDiscovery[0])).toEqual([1, 1]);
    expect(direction(firstDiscovery[1])).toEqual([1, 1]);
    expect(direction(firstDiscovery[2])).toEqual([1, -1]);
    expect(direction(firstDiscovery[3])).toEqual([1, -1]);

    const radii = firstDiscovery.flat().map(({ x, y }) => Math.hypot(x - 49.5, y - 49.5));

    radii.forEach((r) => expect(r).toBeCloseTo(r < 2.5 ? 1.5 : 3.5, 3));
  });

  it('ends with the identity ring, a small circle at (-44, -51)', () => {
    const last = paths.at(-1)!;

    expect(last).toHaveLength(37);
    expect(last[0]).toEqual({ x: -44, y: -51.5 });
    last.forEach(({ x, y }) => expect(Math.hypot(x + 44, y + 51)).toBeCloseTo(0.5, 3));
  });

  it('stays inside the 110 field with the lead added', () => {
    const lead = COUPON_LEAD_MM;

    paths.forEach((path) => {
      path.forEach(({ x, y }) => {
        expect(Math.abs(x)).toBeLessThanOrEqual(53.4 - lead * Math.SQRT1_2);
        expect(Math.abs(y)).toBeLessThanOrEqual(53.4 - lead * Math.SQRT1_2);
      });
    });
    expect(couponExtentMm()).toBeCloseTo(53.39, 2);
    expect(couponExtentMm()).toBeLessThan(55);
  });

  describe('buildLFrameMarks', () => {
    const marks = buildLFrameMarks({ x: 100, y: 200 });

    it('puts the 8 vertices on the ±70 square around the centre', () => {
      const { half } = L_FRAME;

      expect(marks.map(({ vertex }) => vertex)).toEqual([
        { x: 100 - half, y: 200 - half },
        { x: 100, y: 200 - half },
        { x: 100 + half, y: 200 - half },
        { x: 100 + half, y: 200 },
        { x: 100 + half, y: 200 + half },
        { x: 100, y: 200 + half },
        { x: 100 - half, y: 200 + half },
        { x: 100 - half, y: 200 },
      ]);
    });

    it('points both arms of a corner L at the centre', () => {
      expect(marks[0]).toEqual({ end: { x: 30, y: 138 }, start: { x: 38, y: 130 }, vertex: { x: 30, y: 130 } });
      expect(marks[4]).toEqual({ end: { x: 170, y: 262 }, start: { x: 162, y: 270 }, vertex: { x: 170, y: 270 } });
    });

    it('points the along-edge arm of a mid-edge L toward +, the other at the centre', () => {
      // (0, +70): X arm +8, Y arm -8
      expect(marks[5]).toEqual({ end: { x: 100, y: 262 }, start: { x: 108, y: 270 }, vertex: { x: 100, y: 270 } });
      // (0, -70): X arm +8, Y arm +8
      expect(marks[1]).toEqual({ end: { x: 100, y: 138 }, start: { x: 108, y: 130 }, vertex: { x: 100, y: 130 } });
      // (+70, 0): Y arm +8, X arm -8
      expect(marks[3]).toEqual({ end: { x: 170, y: 208 }, start: { x: 162, y: 200 }, vertex: { x: 170, y: 200 } });
      // (-70, 0): Y arm +8, X arm +8
      expect(marks[7]).toEqual({ end: { x: 30, y: 208 }, start: { x: 38, y: 200 }, vertex: { x: 30, y: 200 } });
    });
  });
});
