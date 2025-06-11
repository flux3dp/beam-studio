import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import lang from '@core/app/lang/en';

import { getDefaultLaserModule, getModulesTranslations, getPrintingModule } from './layer-module-helper';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockGetSupportedModules = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getSupportedModules: (...args) => mockGetSupportedModules(...args),
}));

describe('test layer-module-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDefaultLaserModule when workarea is Ador', () => {
    mockRead.mockReturnValueOnce('ado1').mockReturnValueOnce(LayerModule.LASER_10W_DIODE);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_10W_DIODE);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'default-laser-module');

    mockRead.mockReset();
    mockRead.mockReturnValueOnce('ado1').mockReturnValueOnce(LayerModule.LASER_20W_DIODE);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'default-laser-module');

    mockRead.mockReset();
    mockRead.mockReturnValueOnce('ado1').mockReturnValueOnce(LayerModule.LASER_1064);
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_20W_DIODE);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'default-laser-module');
  });

  test('getDefaultLaserModule when workarea is not Ador', () => {
    mockRead.mockReturnValueOnce('fbm2');
    expect(getDefaultLaserModule()).toBe(LayerModule.LASER_UNIVERSAL);
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
  });

  test('getPrintingModule when supported modules includes 4c', () => {
    mockRead.mockReturnValueOnce('fbm2');
    mockGetSupportedModules.mockReturnValue([LayerModule.PRINTER_4C]);
    expect(getPrintingModule()).toBe(LayerModule.PRINTER_4C);
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
  });

  test('getPrintingModule when supported modules does not include 4c', () => {
    mockRead.mockReturnValueOnce('fbm2');
    mockGetSupportedModules.mockReturnValue([LayerModule.PRINTER]);
    expect(getPrintingModule()).toBe(LayerModule.PRINTER);
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
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
      [LayerModule.UV_WHITE_INK]: lang.layer_module.uv_white_ink,
    });
  });
});
