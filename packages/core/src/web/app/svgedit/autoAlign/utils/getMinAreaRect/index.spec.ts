import { convexHull, getMinAreaRect, type Point, polygonArea } from '.';

const deg = (rad: number) => (rad * 180) / Math.PI;
const rotate = (points: Point[], degrees: number, [cx, cy]: Point): Point[] => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);

  return points.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
const rect = (w: number, h: number): Point[] => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];

describe('getMinAreaRect', () => {
  it('returns the long edge angle of an axis-aligned rectangle', () => {
    const r = getMinAreaRect(rect(100, 40));

    expect(r.width).toBeCloseTo(100);
    expect(r.height).toBeCloseTo(40);
    expect(deg(r.angle)).toBeCloseTo(0);
    expect(r.center).toEqual([50, 20]);
    expect(r.rectangularity).toBeCloseTo(1);
  });

  it('reports a tall rectangle as 90° with the long edge as width', () => {
    const r = getMinAreaRect(rect(40, 100));

    expect(r.width).toBeCloseTo(100);
    expect(deg(r.angle)).toBeCloseTo(90);
  });

  it.each([10, 30, -30, 80, 100])('recovers a %d° rotation (mod 180)', (degrees) => {
    const r = getMinAreaRect(rotate(rect(100, 40), degrees, [50, 20]));
    const expected = ((((degrees + 90) % 180) + 180) % 180) - 90;

    expect(deg(r.angle)).toBeCloseTo(expected, 3);
    expect(r.width).toBeCloseTo(100, 3);
    expect(r.height).toBeCloseTo(40, 3);
    expect(r.center[0]).toBeCloseTo(50, 3);
    expect(r.center[1]).toBeCloseTo(20, 3);
  });

  it('ignores interior points and traversal order', () => {
    const points: Point[] = [...rect(100, 40).reverse(), [50, 20], [30, 10]];

    expect(getMinAreaRect(points).rectangularity).toBeGreaterThan(0.5);
    expect(getMinAreaRect(points).width).toBeCloseTo(100);
  });

  it('gives a circle low rectangularity', () => {
    const circle: Point[] = Array.from({ length: 64 }, (_, i) => [
      50 + 50 * Math.cos((i / 64) * 2 * Math.PI),
      50 + 50 * Math.sin((i / 64) * 2 * Math.PI),
    ]);
    const r = getMinAreaRect(circle);

    expect(r.rectangularity).toBeLessThan(0.8);
    expect(r.width / r.height).toBeCloseTo(1, 1);
  });

  it('handles degenerate input without throwing', () => {
    expect(getMinAreaRect([]).width).toBe(0);
    expect(getMinAreaRect([[1, 1]]).width).toBe(0);
    expect(convexHull([]).length).toBe(0);
    expect(polygonArea(rect(2, 3))).toBe(6);
  });
});
