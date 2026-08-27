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

  it('fits the source to the full engravable area instead of capping it at 50mm', () => {
    // 700 scene units = 70mm, so the 500-unit source width is scaled to 70mm.
    expect(getPathScale(500, 250, engravable(700, 700))).toBe(0.14);
  });

  it('fits both axes inside a smaller engravable area', () => {
    // 300 scene units = 30mm wide; 100 scene units = 10mm deep.
    expect(getPathScale(500, 250, engravable(300, 100))).toBe(0.04);
  });

  it('keeps the source scale when the engravable area is invalid', () => {
    expect(getPathScale(250, 500, { ...engravable(0, 0), isValid: false })).toBe(1);
  });
});
