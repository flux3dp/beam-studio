import type { EngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';

import { getPathScale } from './getPathScale';

const engravable = (width: number, depth: number): EngravableBox => ({
  center: [width / 2, depth / 2, 50],
  depth,
  height: 100,
  isValid: true,
  max: [width, depth, 100],
  min: [0, 0, 0],
  width,
});

describe('getPathScale', () => {
  beforeEach(() => jest.clearAllMocks());

  it('preserves the physical size when it fits in the engravable area', () => {
    // 700 scene units = 70mm, so a 50x25mm source already fits.
    expect(getPathScale(50, 25, engravable(700, 700))).toBe(1);
  });

  it('fits both axes inside a smaller engravable area', () => {
    // 300 scene units = 30mm wide; 100 scene units = 10mm deep.
    expect(getPathScale(50, 25, engravable(300, 100))).toBe(0.4);
  });

  it('keeps the physical size when the engravable area is invalid', () => {
    expect(getPathScale(25, 50, { ...engravable(0, 0), isValid: false })).toBe(1);
  });
});
