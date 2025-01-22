import LayerModule from '@core/app/constants/layer-module/layer-modules';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockGetFileFromDialog = jest.fn();
const mockWriteFileDialog = jest.fn();

jest.mock('@app/implementations/dialog', () => ({
  getFileFromDialog: (...args) => mockGetFileFromDialog(...args),
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    beambox: {
      right_panel: {
        laser_panel: {
          dropdown: {
            mm: {
              pre1: 'pre1_name',
              pre2: 'pre2_name',
            },
          },
          preset_management: {
            export_preset_title: 'export_preset_title',
            sure_to_import_presets: 'sure_to_import_presets',
          },
        },
      },
    },
    topmenu: {
      file: {
        all_files: 'all_files',
      },
    },
  },
}));

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockRemoveAt = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  removeAt: (...args) => mockRemoveAt(...args),
  set: (...args) => mockSet(...args),
}));

import presetHelper, { importPresets } from './preset-helper';

let mockStorage = {};

describe('test preset-helper', () => {
  beforeEach(() => {
    presetHelper.resetPresetList();
    jest.resetAllMocks();
    mockStorage = {};
    mockGet.mockImplementation((key) => mockStorage[key]);
    mockSet.mockImplementation((key, value) => {
      mockStorage[key] = JSON.parse(JSON.stringify(value));
    });
    mockRemoveAt.mockImplementation((key) => {
      delete mockStorage[key];
    });
  });

  test('getAllPresets', () => {
    // check __mocks__/app/constants/preset.ts for mock data
    expect(presetHelper.getAllPresets()).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
    ]);
  });

  test('getDefaultPreset', () => {
    expect(presetHelper.getDefaultPreset('pre1', 'fbm1')).toEqual({
      power: 30,
      speed: 30,
    });
    expect(presetHelper.getDefaultPreset('pre2', 'fbm1')).toEqual({
      power: 40,
      speed: 40,
    });
    expect(presetHelper.getDefaultPreset('pre1', 'ado1', LayerModule.LASER_10W_DIODE)).toEqual({
      power: 50,
      speed: 50,
    });
    expect(presetHelper.getDefaultPreset('pre2', 'ado1', LayerModule.LASER_10W_DIODE)).toEqual(null);
  });

  test('getPresetsList', () => {
    expect(presetHelper.getPresetsList('fbm1')).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name', power: 30, speed: 30 },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name', power: 40, speed: 40 },
    ]);
    expect(presetHelper.getPresetsList('fbm1', LayerModule.LASER_10W_DIODE)).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name', power: 30, speed: 30 },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name', power: 40, speed: 40 },
    ]);
    expect(presetHelper.getPresetsList('ado1', LayerModule.LASER_10W_DIODE)).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name', power: 50, speed: 50 },
    ]);
    expect(presetHelper.getPresetsList('ado1', LayerModule.LASER_20W_DIODE)).toEqual([
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name', power: 60, speed: 60 },
    ]);
  });

  test('modelHasPreset', () => {
    expect(presetHelper.modelHasPreset('fbm1', 'pre1')).toBeTruthy();
    expect(presetHelper.modelHasPreset('fbm1', 'pre3')).toBeFalsy();
    expect(presetHelper.modelHasPreset('ado1', 'pre1')).toBeTruthy();
    expect(presetHelper.modelHasPreset('ado1', 'pre3')).toBeFalsy();
  });

  test('exportPresets', async () => {
    mockWriteFileDialog.mockResolvedValue('file_name');

    const mockPresets = [
      { key: 'pre3', name: 'pre3_name', power: 77, speed: 77 },
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
      { key: 'pre4', name: 'pre4_name', power: 88, speed: 88 },
    ];

    await presetHelper.exportPresets(mockPresets);
    expect(mockWriteFileDialog).toBeCalledTimes(1);

    const getContet = mockWriteFileDialog.mock.calls[0][0];

    expect(getContet()).toEqual(JSON.stringify({ presets: mockPresets }));
  });

  test('importPresets', async () => {
    const mockData = {
      presets: [
        { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
        { hide: false, isDefault: true, key: 'pre1' },
      ],
    };
    const mockFile = new File([JSON.stringify(mockData)], 'file_name');

    mockGetFileFromDialog.mockResolvedValue(mockFile);
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
    await importPresets();
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockGetFileFromDialog).toHaveBeenLastCalledWith({
      filters: [{ extensions: ['json', 'JSON'], name: 'JSON' }],
    });
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      buttonType: 'CONFIRM_CANCEL',
      message: 'sure_to_import_presets',
      onConfirm: expect.any(Function),
    });
    expect(mockSet).toBeCalledTimes(2);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'presets', [
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
      { hide: false, isDefault: true, key: 'pre1' },
    ]);
    expect(mockGet('presets')).toEqual([
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
      { hide: false, isDefault: true, key: 'pre1' },
      { hide: false, isDefault: true, key: 'pre2' },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
    ]);
  });

  test('import from old version config', async () => {
    const mockData = {
      customizedLaserConfigs: [
        { name: 'pre3', power: 77, speed: 77 },
        { isDefault: true, key: 'pre4', power: 88, speed: 88 },
      ],
      defaultLaserConfigsInUse: {
        pre4: false,
      },
    };
    const mockFile = new File([JSON.stringify(mockData)], 'file_name');

    mockGetFileFromDialog.mockResolvedValue(mockFile);
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
    await importPresets();
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockGetFileFromDialog).toHaveBeenLastCalledWith({
      filters: [{ extensions: ['json', 'JSON'], name: 'JSON' }],
    });
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      buttonType: 'CONFIRM_CANCEL',
      message: 'sure_to_import_presets',
      onConfirm: expect.any(Function),
    });
    expect(mockSet).toBeCalledTimes(3);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'customizedLaserConfigs', [
      { name: 'pre3', power: 77, speed: 77 },
      { isDefault: true, key: 'pre4', power: 88, speed: 88 },
    ]);
    expect(mockSet).toHaveBeenNthCalledWith(2, 'defaultLaserConfigsInUse', {
      pre4: false,
    });
    expect(mockRemoveAt).toBeCalledTimes(1);
    expect(mockRemoveAt).toHaveBeenLastCalledWith('presets');
    expect(mockGet('presets')).toEqual([
      { hide: false, isDefault: true, key: 'pre1' },
      { hide: false, isDefault: true, key: 'pre2' },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
  });

  test('savePreset', () => {
    presetHelper.savePreset({
      key: 'pre3',
      name: 'pre3_name',
      power: 70,
      speed: 70,
    });
    expect(mockSet).toBeCalledTimes(1);
    expect(mockSet).toHaveBeenLastCalledWith('presets', [
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
    ]);
  });

  test('savePresetList', () => {
    const mockPresets = [
      { key: 'pre3', name: 'pre3_name', power: 77, speed: 77 },
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
      { hide: true, key: 'pre4', name: 'pre4_name', power: 88, speed: 88 },
    ];

    presetHelper.savePresetList(mockPresets);
    expect(mockSet).toBeCalledTimes(1);
    expect(mockSet).toHaveBeenLastCalledWith('presets', mockPresets);
    expect(presetHelper.getAllPresets()).toEqual(mockPresets);
  });

  test('resetPresetList', () => {
    presetHelper.savePreset({
      key: 'pre3',
      name: 'pre3_name',
      power: 70,
      speed: 70,
    });
    expect(mockSet).toBeCalledTimes(1);
    presetHelper.resetPresetList();
    expect(mockSet).toBeCalledTimes(2);
    expect(mockSet).toHaveBeenLastCalledWith('presets', [
      { hide: false, isDefault: true, key: 'pre1' },
      { hide: false, isDefault: true, key: 'pre2' },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
    ]);
  });

  test('migrate from old version config', () => {
    mockStorage = {
      customizedLaserConfigs: [
        { name: 'pre3', power: 77, speed: 77 },
        { isDefault: true, key: 'pre4', power: 88, speed: 88 },
      ],
      defaultLaserConfigsInUse: {
        pre4: false,
      },
    };
    presetHelper.reloadPresets(true);
    expect(mockSet).toBeCalledTimes(1);
    expect(mockGet('presets')).toEqual([
      { hide: false, isDefault: true, key: 'pre1' },
      { hide: false, isDefault: true, key: 'pre2' },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { hide: false, isDefault: true, key: 'pre1', name: 'pre1_name' },
      { hide: false, isDefault: true, key: 'pre2', name: 'pre2_name' },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
  });
});
