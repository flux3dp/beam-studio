import { DetectedLayerModule, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import lang from '@core/app/lang/en';

import {
  getDefaultModule,
  getDetectedModulesTranslations,
  getModulesTranslations,
  getPrintingModule,
  hasModuleLayer,
} from './layer-module-helper';

const mockGetGlobalPreference = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: () => mockGetGlobalPreference(),
  },
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetSupportedModules = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getSupportedModules: (...args) => mockGetSupportedModules(...args),
}));

describe('test layer-module-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDefaultModule when workarea is Ador', () => {
    mockGetGlobalPreference.mockReturnValueOnce({ 'default-laser-module': LayerModule.LASER_10W_DIODE });
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    expect(getDefaultModule()).toBe(LayerModule.LASER_10W_DIODE);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);

    mockGetGlobalPreference.mockReset();
    mockGetState.mockReset();
    mockGetGlobalPreference.mockReturnValueOnce({ 'default-laser-module': LayerModule.LASER_20W_DIODE });
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    expect(getDefaultModule()).toBe(LayerModule.LASER_20W_DIODE);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);

    mockGetGlobalPreference.mockReset();
    mockGetState.mockReset();
    mockGetGlobalPreference.mockReturnValueOnce({ 'default-laser-module': LayerModule.LASER_1064 });
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    expect(getDefaultModule()).toBe(LayerModule.LASER_20W_DIODE);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getDefaultModule when workarea is not Ador and LASER_UNIVERSAL supported', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm2' });
    mockGetSupportedModules.mockReturnValue([LayerModule.LASER_UNIVERSAL, LayerModule.PRINTER_4C]);
    expect(getDefaultModule()).toBe(LayerModule.LASER_UNIVERSAL);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockGetGlobalPreference).not.toHaveBeenCalled();
  });

  test('getDefaultModule when workarea is not Ador and LASER_UNIVERSAL not supported', () => {
    mockGetState.mockReturnValue({ workarea: 'fuv1' });
    mockGetSupportedModules.mockReturnValue([LayerModule.PRINTER_4C, LayerModule.UV_WHITE_INK]);
    expect(getDefaultModule()).toBe(LayerModule.PRINTER_4C);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockGetGlobalPreference).not.toHaveBeenCalled();
  });

  test('getPrintingModule when supported modules includes 4c', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm2' });
    mockGetSupportedModules.mockReturnValue([LayerModule.PRINTER_4C]);
    expect(getPrintingModule()).toBe(LayerModule.PRINTER_4C);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockGetGlobalPreference).not.toHaveBeenCalled();
  });

  test('getPrintingModule when supported modules does not include 4c', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm2' });
    mockGetSupportedModules.mockReturnValue([LayerModule.PRINTER]);
    expect(getPrintingModule()).toBe(LayerModule.PRINTER);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockGetGlobalPreference).not.toHaveBeenCalled();
  });

  test('getPrintingModule when no printer module is supported', () => {
    mockGetState.mockReturnValue({ workarea: 'fpm1' });
    mockGetSupportedModules.mockReturnValue([LayerModule.LASER_UNIVERSAL]);
    expect(getPrintingModule()).toBeNull();
  });

  test('getModulesTranslations', () => {
    expect(getModulesTranslations()).toEqual({
      [LayerModule.LASER_10W_DIODE]: lang.layer_module.laser_10w_diode,
      [LayerModule.LASER_20W_DIODE]: lang.layer_module.laser_20w_diode,
      [LayerModule.LASER_1064]: lang.layer_module.laser_2w_infrared,
      [LayerModule.LASER_UNIVERSAL]: lang.layer_module.general_laser,
      [LayerModule.PRINTER]: lang.layer_module.printing,
      [LayerModule.PRINTER_4C]: lang.layer_module.printing,
      [LayerModule.UV_PRINT]: lang.layer_module.uv_print,
      [LayerModule.UV_VARNISH]: lang.layer_module.uv_varnish,
      [LayerModule.UV_WHITE_INK]: lang.layer_module.uv_white_ink,
    });
  });

  test('getModulesTranslations with 4c note', () => {
    expect(getModulesTranslations(true)).toEqual({
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
      [DetectedLayerModule.PRINTER_4C]: `${lang.layer_module.printing}`,
      [DetectedLayerModule.PRINTER_4C_WITH_1064]: `${lang.layer_module.printing} + 1064`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV]: `${lang.layer_module.printing} + UV`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV_1064]: `${lang.layer_module.printing} + UV + 1064`,
      [DetectedLayerModule.UNKNOWN]: lang.layer_module.unknown,
    });
  });

  test('getDetectedModulesTranslations with 4c note', () => {
    expect(getDetectedModulesTranslations(true)).toEqual({
      [DetectedLayerModule.LASER_10W_DIODE]: lang.layer_module.laser_10w_diode,
      [DetectedLayerModule.LASER_20W_DIODE]: lang.layer_module.laser_20w_diode,
      [DetectedLayerModule.LASER_1064]: lang.layer_module.laser_2w_infrared,
      [DetectedLayerModule.NONE]: lang.layer_module.none,
      [DetectedLayerModule.PRINTER]: lang.layer_module.printing,
      [DetectedLayerModule.PRINTER_4C]: `${lang.layer_module.printing} (4C)`,
      [DetectedLayerModule.PRINTER_4C_WITH_1064]: `${lang.layer_module.printing} (4C) + 1064`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV]: `${lang.layer_module.printing} (4C) + UV`,
      [DetectedLayerModule.PRINTER_4C_WITH_UV_1064]: `${lang.layer_module.printing} (4C) + UV + 1064`,
      [DetectedLayerModule.UNKNOWN]: lang.layer_module.unknown,
    });
  });

  test('hasModuleLayer', () => {
    const mockQuery = jest.fn().mockReturnValue(null);

    document.querySelector = mockQuery;

    expect(hasModuleLayer([LayerModule.PRINTER_4C], { checkRepeat: true, checkVisible: true })).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith('g.layer[data-module="7"]:not([display="none"]):not([data-repeat="0"])');

    expect(
      hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: true, checkVisible: true }),
    ).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([display="none"]):not([data-repeat="0"]), g.layer[data-module="5"]:not([display="none"]):not([data-repeat="0"])',
    );

    expect(
      hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: false, checkVisible: true }),
    ).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([display="none"]), g.layer[data-module="5"]:not([display="none"])',
    );

    expect(
      hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: true, checkVisible: false }),
    ).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'g.layer[data-module="7"]:not([data-repeat="0"]), g.layer[data-module="5"]:not([data-repeat="0"])',
    );

    expect(
      hasModuleLayer([LayerModule.PRINTER_4C, LayerModule.PRINTER], { checkRepeat: false, checkVisible: false }),
    ).toEqual(false);
    expect(mockQuery).toHaveBeenLastCalledWith('g.layer[data-module="7"], g.layer[data-module="5"]');

    mockQuery.mockReturnValue('mock elem');
    expect(hasModuleLayer([LayerModule.PRINTER_4C], { checkRepeat: true, checkVisible: true })).toEqual(true);
  });
});
