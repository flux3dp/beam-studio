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
});
