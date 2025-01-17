import { getBlockSetting } from './BlockSetting';

describe('MaterialTestGeneratorPanel BlockSetting', () => {
  it('should return initial value of block settings', () => {
    expect(getBlockSetting()).toEqual({
      column: {
        count: { value: 10, min: 1, max: 20 },
        size: { value: 10, min: 1, max: Number.MAX_SAFE_INTEGER },
        spacing: { value: 5, min: 1, max: Number.MAX_SAFE_INTEGER },
      },
      row: {
        count: { value: 10, min: 1, max: 20 },
        size: { value: 10, min: 1, max: Number.MAX_SAFE_INTEGER },
        spacing: { value: 5, min: 1, max: Number.MAX_SAFE_INTEGER },
      },
    });
  });
});
