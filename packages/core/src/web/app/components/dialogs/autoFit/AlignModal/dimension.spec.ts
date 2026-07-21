import { calculateDimensionCenter } from './dimension';

describe('calculateDimensionCenter', () => {
  test('returns geometric center when rotation is 0', () => {
    expect(calculateDimensionCenter({ height: 40, rotation: 0, width: 100, x: 10, y: 20 })).toEqual({
      x: 10 + 50,
      y: 20 + 20,
    });
  });

  test('applies 90 degree rotation', () => {
    const result = calculateDimensionCenter({ height: 40, rotation: 90, width: 100, x: 0, y: 0 });

    // cos(90)=0, sin(90)=1 => centerX = -height/2, centerY = width/2
    expect(result.x).toBeCloseTo(-20, 6);
    expect(result.y).toBeCloseTo(50, 6);
  });

  test('applies 180 degree rotation', () => {
    const result = calculateDimensionCenter({ height: 40, rotation: 180, width: 100, x: 5, y: 5 });

    // cos(180)=-1, sin(180)=0 => centerX = x - width/2, centerY = y - height/2
    expect(result.x).toBeCloseTo(5 - 50, 6);
    expect(result.y).toBeCloseTo(5 - 20, 6);
  });

  test('handles arbitrary rotation with offset origin', () => {
    const result = calculateDimensionCenter({ height: 20, rotation: 30, width: 60, x: 100, y: 200 });

    // hand-derived: cos(30°)=0.8660254, sin(30°)=0.5
    // x = 100 + 30 * 0.8660254 - 10 * 0.5       = 120.9807621
    // y = 200 + 30 * 0.5       + 10 * 0.8660254 = 223.6602540
    expect(result.x).toBeCloseTo(120.9807621, 6);
    expect(result.y).toBeCloseTo(223.660254, 6);
  });

  test('rotation is applied clockwise in screen (y-down) coordinates', () => {
    // at -90°: cos=0, sin=-1 => x = x0 + height/2, y = y0 - width/2
    const result = calculateDimensionCenter({ height: 40, rotation: -90, width: 100, x: 0, y: 0 });

    expect(result.x).toBeCloseTo(20, 6);
    expect(result.y).toBeCloseTo(-50, 6);
  });
});
