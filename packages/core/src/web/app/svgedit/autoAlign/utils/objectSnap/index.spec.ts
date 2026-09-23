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
  it('offers every 45° for a near-square object', () => {
    const c = getRotationCandidates(rect(48.3, 392, 371)).map((v) => Math.round(v * 10) / 10);

    expect(c).toEqual([48.3, 93.3, 138.3, -176.7, -131.7, -86.7, -41.7, 3.3]);
  });

  it('offers only edge directions for an elongated object', () => {
    expect(getRotationCandidates(rect(0.3, 1174, 88)).map((v) => Math.round(v * 10) / 10)).toEqual([
      0.3, 90.3, -179.7, -89.7,
    ]);
  });
});
