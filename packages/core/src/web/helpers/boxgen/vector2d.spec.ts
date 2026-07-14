import Vector2d from './vector2d';

describe('Vector2d', () => {
  test('constructor stores x and y', () => {
    const v = new Vector2d(3, -4);

    expect(v.x).toBe(3);
    expect(v.y).toBe(-4);
  });

  test('constructor accepts zero coordinates', () => {
    const v = new Vector2d(0, 0);

    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  describe('mul', () => {
    test('scales both components by a positive scalar', () => {
      const result = new Vector2d(2, 3).mul(2);

      expect(result.x).toBeCloseTo(4);
      expect(result.y).toBeCloseTo(6);
    });

    test('scales by a negative scalar (flips direction)', () => {
      const result = new Vector2d(2, -3).mul(-1);

      expect(result.x).toBeCloseTo(-2);
      expect(result.y).toBeCloseTo(3);
    });

    test('scaling by zero yields the zero vector', () => {
      const result = new Vector2d(5, 7).mul(0);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    test('scaling by a fractional scalar', () => {
      const result = new Vector2d(3, 4).mul(0.5);

      expect(result.x).toBeCloseTo(1.5);
      expect(result.y).toBeCloseTo(2);
    });

    test('returns a new instance and does not mutate the original', () => {
      const original = new Vector2d(2, 3);
      const result = original.mul(4);

      expect(result).not.toBe(original);
      expect(result).toBeInstanceOf(Vector2d);
      expect(original.x).toBe(2);
      expect(original.y).toBe(3);
    });
  });
});
