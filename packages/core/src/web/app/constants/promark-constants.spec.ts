import {
  getDefaultPromarkWorkarea,
  getPromarkFieldWorksize,
  getPromarkLaserSource,
  getPromarkWorkareaOptions,
  isPromarkWorkareaCompatible,
  LaserType,
} from './promark-constants';

describe('Promark laser source constants', () => {
  test('allows UV to use 70 or 200 mm and MOPA-family sources to use 110, 150, or 220 mm', () => {
    expect(getPromarkWorkareaOptions(LaserType.UV)).toEqual([70, 200]);
    expect(getPromarkWorkareaOptions(LaserType.MOPA)).toEqual([110, 150, 220]);
    expect(getPromarkWorkareaOptions(LaserType.Desktop)).toEqual([110, 150, 220]);
    expect(isPromarkWorkareaCompatible(LaserType.MOPA, 150)).toBe(true);
    expect(isPromarkWorkareaCompatible(LaserType.MOPA, 220)).toBe(true);
    expect(isPromarkWorkareaCompatible(LaserType.UV, 200)).toBe(true);
    expect(isPromarkWorkareaCompatible(LaserType.UV, 110)).toBe(false);
  });

  test('centralizes the initialization defaults', () => {
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.UV, watt: 5 })).toBe(70);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.MOPA, watt: 20 })).toBe(110);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.MOPA, watt: 60 })).toBe(220);
    expect(getDefaultPromarkWorkarea({ laserType: LaserType.Desktop, watt: 20 })).toBe(220);
  });

  test('only applies the UV field correction to the 70 mm work area', () => {
    expect(getPromarkFieldWorksize(LaserType.UV, 70)).toBe(75);
    expect(getPromarkFieldWorksize(LaserType.UV, 200)).toBe(200);
    expect(getPromarkFieldWorksize(LaserType.Desktop, 70)).toBe(70);
  });

  test('maps Desktop and unknown values to the MOPA backend fallback', () => {
    expect(getPromarkLaserSource(LaserType.UV)).toBe('UV');
    expect(getPromarkLaserSource(LaserType.MOPA)).toBe('MOPA');
    expect(getPromarkLaserSource(LaserType.Desktop)).toBe('MOPA');
    expect(getPromarkLaserSource(undefined)).toBe('MOPA');
  });
});
