import { getBlockSetting } from './BlockSetting';

describe('MaterialTestGeneratorPanel BlockSetting', () => {
  it('should return initial value of block settings', () => {
    expect(getBlockSetting()).toEqual({
      column: {
        count: { max: 20, min: 1, value: 10 },
        size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
        spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
      },
      row: {
        count: { max: 20, min: 1, value: 10 },
        size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
        spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
      },
    });
  });

  // A comparison block is two halves side by side, and both have to land inside one galvo field or
  // the exporter splits the block and the seam joins the comparison.
  describe('with a galvo field', () => {
    it('caps a half at half the field and the height at the whole field, less a margin', () => {
      const { column, row } = getBlockSetting({ fieldSize: 110 });

      expect(row.size.max).toBe(54);
      expect(column.size.max).toBe(108);
    });

    it('keeps both halves large enough to read', () => {
      const { column, row } = getBlockSetting({ fieldSize: 110 });

      expect(row.size.min).toBe(3);
      expect(column.size.min).toBe(3);
    });

    it('never caps below what it insists on as a minimum', () => {
      const { column, row } = getBlockSetting({ fieldSize: 4 });

      expect(row.size.max).toBeGreaterThanOrEqual(row.size.min);
      expect(column.size.max).toBeGreaterThanOrEqual(column.size.min);
    });

    it('leaves the default size inside the cap', () => {
      const { row } = getBlockSetting({ fieldSize: 10 });

      expect(row.size.value).toBeLessThanOrEqual(row.size.max);
      expect(row.size.value).toBeGreaterThanOrEqual(row.size.min);
    });
  });
});
