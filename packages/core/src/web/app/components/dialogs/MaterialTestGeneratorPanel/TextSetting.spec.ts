import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

// The central __mocks__ for layer-config-helper only stubs getData, so moduleBaseConfig would be
// undefined here. Mirrors the real table (getData kept for parity with the central mock).
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (_key: string) => 'configName',
  moduleBaseConfig: {
    [jest.requireActual('@core/app/constants/layer-module/layer-modules').LayerModule.GALVO_CO2]: {
      frequency: 32,
      speed: 1000,
    },
    [jest.requireActual('@core/app/constants/layer-module/layer-modules').LayerModule.GALVO_MOPA]: {
      frequency: 25,
      pulseWidth: 350,
      speed: 1000,
    },
  },
}));

import { getTextSetting } from './TextSetting';

describe('getTextSetting', () => {
  it('runs a gantry head at its own speed', () => {
    expect(getTextSetting('fbb2')).toEqual({
      power: 15,
      select: { label: 'Custom', value: 'custom' },
      speed: 20,
    });
  });

  it('keeps the promark speed', () => {
    expect(getTextSetting('fpm1').speed).toBe(1000);
  });

  // Labels on a galvo layer are engraved by the galvo, which runs an order of magnitude faster; at
  // 20mm/s they would take longer than the test itself.
  it('takes a galvo head speed from the module', () => {
    expect(getTextSetting('fhx2galvo', LayerModule.GALVO_CO2).speed).toBe(1000);
    expect(getTextSetting('fhx2galvo', LayerModule.GALVO_MOPA).speed).toBe(1000);
  });

  it('falls back to the workarea when the module has no speed of its own', () => {
    expect(getTextSetting('fbb2', LayerModule.LASER_UNIVERSAL).speed).toBe(20);
  });
});
