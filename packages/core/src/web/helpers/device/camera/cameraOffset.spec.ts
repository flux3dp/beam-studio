import { parseCameraFlip, parseCameraOffset } from './cameraOffset';

describe('parseCameraOffset', () => {
  test('reads X, Y, R and the per-axis ratios', () => {
    expect(parseCameraOffset('Y:30.5 X:20.25 R:-0.0125 S:1.6 SX:1.625 SY:1.575')).toEqual({
      angle: -0.0125,
      scaleRatioX: 1.625,
      scaleRatioY: 1.575,
      x: 20.25,
      y: 30.5,
    });
  });

  test('falls back to S for both ratios on firmware without SX / SY', () => {
    const { scaleRatioX, scaleRatioY } = parseCameraOffset('Y:30.0 X:20.0 R:0.0 S:1.625');

    expect(scaleRatioX).toBe(1.625);
    expect(scaleRatioY).toBe(1.625);
  });

  test('does not read X from the tail of SX', () => {
    // SX comes before X: a regex without the leading space would match `SX:1.5` as X
    expect(parseCameraOffset('SX:1.5 SY:1.5 Y:3.0 X:-2.0 R:0.0 S:1.5').x).toBe(-2);
  });
});

describe('parseCameraFlip', () => {
  test('is true for F:1 and false for F:0', () => {
    expect(parseCameraFlip('Y:30.0 X:20.0 R:0.0 S:1.6 F:1.0')).toBe(true);
    expect(parseCameraFlip('Y:30.0 X:20.0 R:0.0 S:1.6 F:0.0')).toBe(false);
  });

  test('is false when F is absent', () => {
    expect(parseCameraFlip('Y:30.0 X:20.0 R:0.0 S:1.6')).toBe(false);
  });
});
