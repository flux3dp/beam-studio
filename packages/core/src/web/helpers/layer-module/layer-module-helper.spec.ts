import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import lang from '@core/app/lang/en';

import { getDefaultLaserModule, getModulesTranslations } from './layer-module-helper';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

describe('test layer-module-helper', () => {
  test('getDefaultLaserModule', () => {
    mockRead.mockReturnValue(LayerModule.LASER_10W_DIODE);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_10W_DIODE);

    mockRead.mockReturnValue(LayerModule.LASER_20W_DIODE);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);

    mockRead.mockReturnValue(LayerModule.LASER_1064);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);
  });

  test('getModulesTranslations', () => {
    expect(getModulesTranslations()).toEqual({
      [LayerModule.LASER_10W_DIODE]: lang.layer_module.laser_10w_diode,
      [LayerModule.LASER_20W_DIODE]: lang.layer_module.laser_20w_diode,
      [LayerModule.LASER_1064]: lang.layer_module.laser_2w_infrared,
      [LayerModule.LASER_UNIVERSAL]: lang.layer_module.general_laser,
      [LayerModule.NONE]: lang.layer_module.none,
      [LayerModule.PRINTER]: lang.layer_module.printing,
      [LayerModule.PRINTER_4C]: `${lang.layer_module.printing} (4C)`,
      [LayerModule.UNKNOWN]: lang.layer_module.unknown,
      [LayerModule.UV_PRINT]: lang.layer_module.uv_print,
    });
  });
});
