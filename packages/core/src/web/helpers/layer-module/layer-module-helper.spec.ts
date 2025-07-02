import { DetectedLayerModule, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import lang from '@core/app/lang/en';

import {
  getDefaultLaserModule,
  getDetectedModulesTranslations,
  getModulesTranslations,
  getPrintingModule,
  hasModuleLayer,
} from './layer-module-helper';

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
      [LayerModule.PRINTER]: lang.layer_module.printing,
      [LayerModule.PRINTER_4C]: `${lang.layer_module.printing} (4C)`,
      [LayerModule.UV_PRINT]: lang.layer_module.uv_print,
      [LayerModule.UV_VARNISH]: lang.layer_module.uv_varnish,
      [LayerModule.UV_WHITE_INK]: lang.layer_module.uv_white_ink,
    });
  });

  test('getDetectedModulesTranslations', () => {
    expect(getDetectedModulesTranslations()).toEqual({
      [DetectedLayerModule.LASER_10W_DIODE]: lang.layer_module.laser_10w_diode,
      [DetectedLayerModule.LASER_20W_DIODE]: lang.layer_module.laser_20w_diode,
      [DetectedLayerModule.LASER_1064]: lang.layer_module.laser_2w_infrared,
      [DetectedLayerModule.NONE]: lang.layer_module.none,
      [DetectedLayerModule.PRINTER]: lang.layer_module.printing,
      [DetectedLayerModule.PRINTER_4C]: `${lang.layer_module.printing} (4C)`,
      [DetectedLayerModule.PRINTER_4C_WITH_1064]: `${lang.layer_module.printing} (4C + 1064)`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV]: `${lang.layer_module.printing} (4C + UV)`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV_1064]: `${lang.layer_module.printing} (4C + UV + 1064)`,
      [DetectedLayerModule.UNKNOWN]: lang.layer_module.unknown,
    });
  });

  test('hasModuleLayer', () => {
    const mockQuery = jest.fn().mockReturnValue(null);

    document.querySelector = mockQuery;

    expect(hasModuleLayer([LayerModule.PRINTER_4C])).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith('g.layer[data-module="7"]:not([display="none"]):not([data-repeat="0"])');

    expect(hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER])).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([display="none"]):not([data-repeat="0"]), g.layer[data-module="5"]:not([display="none"]):not([data-repeat="0"])',
    );

    expect(hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: false })).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([display="none"]), g.layer[data-module="5"]:not([display="none"])',
    );

    expect(hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkVisible: false })).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([data-repeat="0"]), g.layer[data-module="5"]:not([data-repeat="0"])',
    );

    expect(
      hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: false, checkVisible: false }),
    ).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith('g.layer[data-module="7"], g.layer[data-module="5"]');

    mockQuery.mockReturnValue('mock elem');
    expect(hasModuleLayer([LayerModule.PRINTER_4C])).toEqual(true);
  });
});
