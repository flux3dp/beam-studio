import LayerModule from 'app/constants/layer-module/layer-modules';

import layerModuleHelper from './layer-module-helper';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    layer_module: {
      none: 'none',
      laser_10w_diode: 'laser_10w_diode',
      laser_20w_diode: 'laser_20w_diode',
      laser_2w_infrared: 'laser_2w_infrared',
      printing: 'printing',
      unknown: 'unknown',
    },
  },
}));

describe('test layer-module-helper', () => {
  test('getDefaultLaserModule', () => {
    mockRead.mockReturnValue(LayerModule.LASER_10W_DIODE);
    expect(layerModuleHelper.getDefaultLaserModule()).toBe(LayerModule.LASER_10W_DIODE);

    mockRead.mockReturnValue(LayerModule.LASER_20W_DIODE);
    expect(layerModuleHelper.getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);

    mockRead.mockReturnValue(LayerModule.LASER_1064);
    expect(layerModuleHelper.getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);
  });

  test('getModulesTranslations', () => {
    expect(layerModuleHelper.getModulesTranslations()).toEqual({
      0: 'none',
      [LayerModule.LASER_10W_DIODE]: 'laser_10w_diode',
      [LayerModule.LASER_20W_DIODE]: 'laser_20w_diode',
      [LayerModule.LASER_1064]: 'laser_2w_infrared',
      [LayerModule.PRINTER]: 'printing',
      [LayerModule.UNKNOWN]: 'unknown',
    });
  });
});
