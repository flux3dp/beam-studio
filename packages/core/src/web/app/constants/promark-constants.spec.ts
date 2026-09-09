import {
  getDefaultPromarkWorkarea,
  getPromarkLaserSource,
  getPromarkWorkareaOptions,
  isPromarkWorkareaCompatible,
  LaserType,
} from './promark-constants';

describe('Promark laser source constants', () => {
  test('limits UV to 70 mm and allows every MOPA-family source to use 110, 150, or 220 mm', () => {
    expect(getPromarkWorkareaOptions(LaserType.UV)).toEqual([70]);
    expect(getPromarkWorkareaOptions(LaserType.MOPA)).toEqual([110, 150, 220]);
    expect(getPromarkWorkareaOptions(LaserType.Desktop)).toEqual([110, 150, 220]);
    expect(isPromarkWorkareaCompatible(LaserType.MOPA, 150)).toBe(true);
    expect(isPromarkWorkareaCompatible(LaserType.MOPA, 220)).toBe(true);
    expect(isPromarkWorkareaCompatible(LaserType.UV, 110)).toBe(false);
  });

  test('centralizes the initialization defaults', () => {
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.UV, watt: 5 })).toBe(70);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.MOPA, watt: 20 })).toBe(110);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.MOPA, watt: 60 })).toBe(220);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.Desktop, watt: 20 })).toBe(220);
  });

  test('maps Desktop and unknown values to the MOPA backend fallback', () => {
    expect(getPromarkLaserSource(LaserType.UV)).toBe('UV');
    expect(getPromarkLaserSource(LaserType.MOPA)).toBe('MOPA');
    expect(getPromarkLaserSource(LaserType.Desktop)).toBe('MOPA');
    expect(getPromarkLaserSource(undefined)).toBe('MOPA');
  });
});
