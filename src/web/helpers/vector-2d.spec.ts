import {
  v2Add, v2Sum, vector2D, v2Sub, v2Length, v2Normalize,
  v2Negate, v2Scale, v2Distance, v2Dot, v2Angle,
} from './vector-2d';

describe('test vector-2d', () => {
  test('test v2Add', () => {
    expect(v2Add({
      x: 1,
      y: 2,
    }, {
      x: 2,
      y: 3,
    })).toEqual({
      x: 3,
      y: 5,
    });
  });

  test('test v2Sum', () => {
    const vectors: vector2D[] = [
      {
        x: 1,
        y: 2,
      }, {
        x: 2,
        y: 3,
      }, {
        x: 3,
        y: 4,
      },
    ];
    expect(v2Sum(...vectors)).toEqual({
      x: 6,
      y: 9,
    });
  });

  test('test v2Sub', () => {
    expect(v2Sub({
      x: 1,
      y: 2,
    }, {
      x: 2,
      y: 3,
    })).toEqual({
      x: -1,
      y: -1,
    });
  });

  test('test v2Length', () => {
    expect(v2Length({
      x: 1,
      y: 2,
    })).toBe(2.23606797749979);
  });

  test('test v2Normalize', () => {
    expect(v2Normalize({
      x: 1,
      y: 2,
    })).toEqual({
      x: 0.4472135954999579,
      y: 0.8944271909999159,
    });

    expect(v2Normalize({
      x: 0,
      y: 0,
    })).toEqual({
      x: 0,
      y: 0,
    });
  });

  test('test v2Negate', () => {
    expect(v2Negate({
      x: 1,
      y: 2,
    })).toEqual({
      x: -1,
      y: -2,
    });
  });

  test('test v2Scale', () => {
    expect(v2Scale({
      x: 1,
      y: 2,
    }, 10)).toEqual({
      x: 10,
      y: 20,
    });
  });

  test('test v2Distance', () => {
    expect(v2Distance({
      x: 1,
      y: 2,
    }, {
      x: 2,
      y: 3,
    })).toBe(1.4142135623730951);
  });

  test('test v2Dot', () => {
    expect(v2Dot({
      x: 1,
      y: 2,
    }, {
      x: 2,
      y: 3,
    })).toBe(8);
  });

  test('test v2Angle', () => {
    expect(v2Angle({
      x: 1,
      y: 2,
    }, {
      x: 2,
      y: 3,
    })).toBe(0.1243549945467625);

    expect(v2Angle({
      x: 0,
      y: 0,
    }, {
      x: 2,
      y: 3,
    })).toBeNull();
  });
});
