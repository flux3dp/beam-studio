import { LaserType } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';

const mockGetPromarkLimit = jest.fn();

// The central __mocks__ for layer-config-helper only stubs getData; TableSetting also needs
// getPromarkLimit, so provide it here (getData kept for parity with the central mock).
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (_key: string) => 'configName',
  getPromarkLimit: () => mockGetPromarkLimit(),
}));

import { getTableSetting } from './TableSetting';

const promarkLimit = {
  frequency: { max: 60, min: 27 },
  pulseWidth: { max: 500, min: 2 },
};

describe('getTableSetting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromarkLimit.mockReturnValue(promarkLimit);
  });

  describe('common (non-promark) laser model', () => {
    test('returns the common params keyed to column/row/static', () => {
      const setting = getTableSetting('ado1');
      const { maxSpeed } = getWorkarea('ado1');

      expect(Object.keys(setting).sort()).toEqual(['repeat', 'speed', 'strength']);

      // strength -> column (0)
      expect(setting.strength).toEqual({
        default: 15,
        max: 100,
        maxValue: 100,
        min: 1,
        minValue: 15,
        selected: 0,
      });
      // speed -> row (1); max/maxValue derive from the workarea's maxSpeed
      expect(setting.speed).toEqual({
        default: 20,
        max: maxSpeed,
        maxValue: maxSpeed,
        min: 1,
        minValue: 20,
        selected: 1,
      });
      // repeat -> static (2)
      expect(setting.repeat).toEqual({
        default: 1,
        max: 100,
        maxValue: 5,
        min: 1,
        minValue: 1,
        selected: 2,
      });
    });

    test('does not include promark-only params', () => {
      const setting = getTableSetting('ado1');

      expect(setting.fillInterval).toBeUndefined();
      expect(setting.frequency).toBeUndefined();
      expect(setting.pulseWidth).toBeUndefined();
    });

    test('speed max tracks the workarea maxSpeed for a different model', () => {
      const setting = getTableSetting('fbb2');
      const { maxSpeed } = getWorkarea('fbb2');

      // Guard: if these two models ever share the same maxSpeed this test becomes
      // vacuous (it could no longer distinguish "derived from workarea" from "hardcoded").
      expect(maxSpeed).not.toBe(getWorkarea('ado1').maxSpeed);

      expect(setting.speed.max).toBe(maxSpeed);
      expect(setting.speed.maxValue).toBe(maxSpeed);
    });

    test('does not call getPromarkLimit for non-promark models', () => {
      getTableSetting('ado1');

      expect(mockGetPromarkLimit).not.toHaveBeenCalled();
    });
  });

  describe('promark model (fpm1)', () => {
    test('returns promark params with speed bounded by the workarea speeds', () => {
      const setting = getTableSetting('fpm1', { laserType: LaserType.Desktop });
      const { maxSpeed, minSpeed } = getWorkarea('fpm1');

      expect(setting.fillInterval).toEqual({
        default: 0.01,
        max: 100,
        maxValue: 1,
        min: 0.0001,
        minValue: 0.01,
        selected: 2,
      });
      expect(setting.frequency).toEqual({
        default: promarkLimit.frequency.min,
        max: promarkLimit.frequency.max,
        maxValue: promarkLimit.frequency.max,
        min: promarkLimit.frequency.min,
        minValue: promarkLimit.frequency.min,
        selected: 2,
      });
      expect(setting.speed).toEqual({
        default: 1000,
        max: maxSpeed,
        maxValue: maxSpeed,
        min: minSpeed,
        minValue: minSpeed,
        selected: 1,
      });
      expect(setting.strength.selected).toBe(0);
      expect(setting.repeat.selected).toBe(2);
    });

    test('omits pulseWidth for a Desktop (non-MOPA) laser', () => {
      const setting = getTableSetting('fpm1', { laserType: LaserType.Desktop });

      expect(setting.pulseWidth).toBeUndefined();
      // Exact key set: common params + promark params, nothing else.
      expect(Object.keys(setting).sort()).toEqual(['fillInterval', 'frequency', 'repeat', 'speed', 'strength']);
    });

    test('includes pulseWidth for a MOPA laser, bounded by the promark limit', () => {
      const setting = getTableSetting('fpm1', { laserType: LaserType.MOPA });

      expect(Object.keys(setting).sort()).toEqual([
        'fillInterval',
        'frequency',
        'pulseWidth',
        'repeat',
        'speed',
        'strength',
      ]);
      expect(setting.pulseWidth).toEqual({
        default: 350,
        max: promarkLimit.pulseWidth.max,
        maxValue: promarkLimit.pulseWidth.max,
        min: promarkLimit.pulseWidth.min,
        minValue: promarkLimit.pulseWidth.min,
        selected: 2,
      });
    });

    test('frequency reflects whatever getPromarkLimit returns', () => {
      mockGetPromarkLimit.mockReturnValue({
        frequency: { max: 4000, min: 1 },
        pulseWidth: { max: 500, min: 2 },
      });

      const setting = getTableSetting('fpm1', { laserType: LaserType.Desktop });

      expect(setting.frequency).toMatchObject({
        default: 1,
        max: 4000,
        maxValue: 4000,
        min: 1,
        minValue: 1,
      });
    });
  });

  test('defaults to Desktop laserType when settingInfos is omitted', () => {
    const setting = getTableSetting('fpm1');

    expect(setting.pulseWidth).toBeUndefined();
  });
});
