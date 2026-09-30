import { getRotationCandidates, wrapDeg } from '.';

const rect = (angleDeg: number, width: number, height: number) => ({
  angle: (angleDeg * Math.PI) / 180,
  center: [0, 0] as [number, number],
  height,
  rectangularity: 1,
  width,
});

describe('wrapDeg', () => {
  it.each([
    [0, 0],
    [180, -180],
    [-180, -180],
    [190, -170],
    [-190, 170],
    [360, 0],
    [48.3, 48.3],
  ])('wraps %d to %d', (input, expected) => {
    expect(wrapDeg(input)).toBeCloseTo(expected);
  });
});

describe('getRotationCandidates', () => {
  const angles = (rect: ReturnType<typeof rect>) =>
    getRotationCandidates(rect)
      .map((c) => Math.round(c.angle * 10) / 10)
      .sort((a, b) => a - b);

  it('offers every 45° for a near-square object', () => {
    expect(angles(rect(48.3, 392, 371))).toEqual([-176.7, -131.7, -86.7, -41.7, 3.3, 48.3, 93.3, 138.3]);
  });

  it('offers only edge directions for an elongated object', () => {
    expect(angles(rect(0.3, 1174, 88))).toEqual([-179.7, -89.7, 0.3, 90.3]);
  });

  it('sizes the guide to the extent along each direction', () => {
    const byAngle = Object.fromEntries(
      getRotationCandidates(rect(0, 100, 40)).map((c) => [Math.round(c.angle), c.halfLength]),
    );

    expect(byAngle[0]).toBe(50);
    expect(byAngle[90]).toBe(20);
    expect(byAngle[-90]).toBe(20);
    expect(byAngle[-180]).toBe(50);
  });
});
