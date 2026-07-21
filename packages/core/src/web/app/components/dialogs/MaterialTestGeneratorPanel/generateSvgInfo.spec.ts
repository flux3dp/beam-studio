import generateSvgInfo from './generateSvgInfo';
import type { BlockSetting } from './BlockSetting';
import type { Detail, TableSetting } from './TableSetting';

const makeDetail = (partial: Partial<Detail> & Pick<Detail, 'selected'>): Detail => ({
  default: 0,
  max: 0,
  maxValue: 0,
  min: 0,
  minValue: 0,
  ...partial,
});

const makeBlockSetting = (colCount: number, rowCount: number): BlockSetting => ({
  column: {
    count: { max: 20, min: 1, value: colCount },
    size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
    spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
  },
  row: {
    count: { max: 20, min: 1, value: rowCount },
    size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
    spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
  },
});

// strength(selected 0) -> column, speed(selected 1) -> row, repeat(selected 2) -> static
const commonTableSetting: TableSetting = {
  repeat: makeDetail({ default: 1, maxValue: 5, minValue: 1, selected: 2 }),
  speed: makeDetail({ default: 20, maxValue: 400, minValue: 20, selected: 1 }),
  strength: makeDetail({ default: 15, maxValue: 100, minValue: 15, selected: 0 }),
};

describe('generateSvgInfo', () => {
  test('produces colCount * rowCount entries', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(3, 4),
      tableSetting: commonTableSetting,
    });

    expect(result).toHaveLength(12);
  });

  test('generates correct strength (column) and speed (row) progressions', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(3, 5),
      tableSetting: commonTableSetting,
    });

    // column axis = strength: min 15, max 100, length 3
    // i=0 -> 15, i=1 -> 57.5 -> ceil 58, i=2 -> 100
    const strengths = [...new Set(result.map((r) => r.strength))].sort((a, b) => a - b);

    expect(strengths).toEqual([15, 58, 100]);

    // row axis = speed: min 20, max 400, length 5
    // steps: 20, 115, 210, 305, 400
    const speeds = [...new Set(result.map((r) => r.speed))].sort((a, b) => a - b);

    expect(speeds).toEqual([20, 115, 210, 305, 400]);
  });

  test('static params are attached (as their default) via the spread', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(2, 2),
      tableSetting: commonTableSetting,
    });

    // Static params (here: repeat) are spread from an array, so they land under
    // numeric index keys rather than top-level named fields. Assert actual output.
    expect(result.every((r) => (r as any)[0].repeat === 1)).toBe(true);
  });

  test('names encode column and row values with the naming map', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(2, 2),
      tableSetting: commonTableSetting,
    });

    // strength -> P, speed -> S
    // column strengths: [15, 100], row speeds: [20, 400]
    expect(result.map((r) => r.name)).toEqual(['P15-S20', 'P15-S400', 'P100-S20', 'P100-S400']);
  });

  test('axis assignment follows `selected`, not the param identity', () => {
    // Swap the axes: speed -> column (0), strength -> row (1).
    const tableSetting: TableSetting = {
      repeat: makeDetail({ default: 1, maxValue: 5, minValue: 1, selected: 2 }),
      speed: makeDetail({ default: 20, maxValue: 400, minValue: 20, selected: 0 }),
      strength: makeDetail({ default: 15, maxValue: 100, minValue: 15, selected: 1 }),
    };

    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(2, 2),
      tableSetting,
    });

    // Names must flip to S..-P.. and speed must now vary across the column axis.
    expect(result.map((r) => r.name)).toEqual(['S20-P15', 'S20-P100', 'S400-P15', 'S400-P100']);
    expect(result.map((r) => [r.speed, r.strength])).toEqual([
      [20, 15],
      [20, 100],
      [400, 15],
      [400, 100],
    ]);
  });

  test('boundary values are the exact min and max for each axis', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(4, 3),
      tableSetting: commonTableSetting,
    });

    const strengths = result.map((r) => r.strength);
    const speeds = result.map((r) => r.speed);

    expect(Math.min(...strengths)).toBe(15);
    expect(Math.max(...strengths)).toBe(100);
    expect(Math.min(...speeds)).toBe(20);
    expect(Math.max(...speeds)).toBe(400);
  });

  test('single-count axis collapses to the min value (no divide-by-zero)', () => {
    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(1, 1),
      tableSetting: commonTableSetting,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'P15-S20', speed: 20, strength: 15 });
    expect((result[0] as any)[0].repeat).toBe(1);
  });

  test('rounds fillInterval to 4 decimal places while ceil-ing integer params', () => {
    // Put fillInterval on the column axis (selected 0) to exercise the rounding branch.
    const tableSetting: TableSetting = {
      fillInterval: makeDetail({ default: 0.01, maxValue: 1, minValue: 0.01, selected: 0 }),
      frequency: makeDetail({ default: 27, maxValue: 60, minValue: 27, selected: 2 }),
      repeat: makeDetail({ default: 1, maxValue: 5, minValue: 1, selected: 2 }),
      speed: makeDetail({ default: 1000, maxValue: 10000, minValue: 500, selected: 1 }),
      strength: makeDetail({ default: 15, maxValue: 100, minValue: 15, selected: 2 }),
    };

    const result = generateSvgInfo({
      blockSetting: makeBlockSetting(3, 1),
      tableSetting,
    });

    // fillInterval column: min 0.01, max 1, length 3 -> 0.01, 0.505, 1
    const fillIntervals = [...new Set(result.map((r) => r.fillInterval))].sort((a, b) => a! - b!);

    expect(fillIntervals).toEqual([0.01, 0.505, 1]);

    // static params (frequency, repeat, strength) keep their defaults, spread under
    // numeric index keys in sorted-by-`selected` order.
    result.forEach((r) => {
      const staticValues = Object.assign({}, (r as any)[0], (r as any)[1], (r as any)[2]);

      expect(staticValues).toEqual({ frequency: 27, repeat: 1, strength: 15 });
    });
  });
});
