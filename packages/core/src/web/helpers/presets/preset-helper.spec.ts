import LayerModule from 'app/constants/layer-module/layer-modules';

const mockPopUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockGetFileFromDialog = jest.fn();
const mockWriteFileDialog = jest.fn();
jest.mock('implementations/dialog', () => ({
  getFileFromDialog: (...args) => mockGetFileFromDialog(...args),
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

jest.mock('helpers/i18n', () => ({
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
            sure_to_import_presets: 'sure_to_import_presets',
            export_preset_title: 'export_preset_title',
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
jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  removeAt: (...args) => mockRemoveAt(...args),
}));

// eslint-disable-next-line import/first
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
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
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
    expect(presetHelper.getDefaultPreset('pre2', 'ado1', LayerModule.LASER_10W_DIODE)).toEqual(
      null
    );
  });

  test('getPresetsList', () => {
    expect(presetHelper.getPresetsList('fbm1')).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, power: 30, speed: 30, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, power: 40, speed: 40, hide: false },
    ]);
    expect(presetHelper.getPresetsList('fbm1', LayerModule.LASER_10W_DIODE)).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, power: 30, speed: 30, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, power: 40, speed: 40, hide: false },
    ]);
    expect(presetHelper.getPresetsList('ado1', LayerModule.LASER_10W_DIODE)).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, power: 50, speed: 50, hide: false },
    ]);
    expect(presetHelper.getPresetsList('ado1', LayerModule.LASER_20W_DIODE)).toEqual([
      { key: 'pre2', name: 'pre2_name', isDefault: true, power: 60, speed: 60, hide: false },
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
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
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
        { key: 'pre1', isDefault: true, hide: false },
      ],
    };
    const mockFile = new File([JSON.stringify(mockData)], 'file_name');
    mockGetFileFromDialog.mockResolvedValue(mockFile);
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
    await importPresets();
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockGetFileFromDialog).toHaveBeenLastCalledWith({
      filters: [{ name: 'JSON', extensions: ['json', 'JSON'] }],
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
      { key: 'pre1', isDefault: true, hide: false },
    ]);
    expect(mockGet('presets')).toEqual([
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
      { key: 'pre1', isDefault: true, hide: false },
      { key: 'pre2', isDefault: true, hide: false },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
    ]);
  });

  test('import from old version config', async () => {
    const mockData = {
      customizedLaserConfigs: [
        { name: 'pre3', power: 77, speed: 77 },
        { key: 'pre4', power: 88, speed: 88, isDefault: true },
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
      filters: [{ name: 'JSON', extensions: ['json', 'JSON'] }],
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
      { key: 'pre4', power: 88, speed: 88, isDefault: true },
    ]);
    expect(mockSet).toHaveBeenNthCalledWith(2, 'defaultLaserConfigsInUse', {
      pre4: false,
    });
    expect(mockRemoveAt).toBeCalledTimes(1);
    expect(mockRemoveAt).toHaveBeenLastCalledWith('presets');
    expect(mockGet('presets')).toEqual([
      { key: 'pre1', isDefault: true, hide: false },
      { key: 'pre2', isDefault: true, hide: false },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
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
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
      { key: 'pre3', name: 'pre3_name', power: 70, speed: 70 },
    ]);
  });

  test('savePresetList', () => {
    const mockPresets = [
      { key: 'pre3', name: 'pre3_name', power: 77, speed: 77 },
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
      { key: 'pre4', name: 'pre4_name', power: 88, speed: 88, hide: true },
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
      { key: 'pre1', isDefault: true, hide: false },
      { key: 'pre2', isDefault: true, hide: false },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
    ]);
  });

  test('migrate from old version config', () => {
    mockStorage = {
      customizedLaserConfigs: [
        { name: 'pre3', power: 77, speed: 77 },
        { key: 'pre4', power: 88, speed: 88, isDefault: true },
      ],
      defaultLaserConfigsInUse: {
        pre4: false,
      },
    };
    presetHelper.reloadPresets(true);
    expect(mockSet).toBeCalledTimes(1);
    expect(mockGet('presets')).toEqual([
      { key: 'pre1', isDefault: true, hide: false },
      { key: 'pre2', isDefault: true, hide: false },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
    expect(presetHelper.getAllPresets()).toEqual([
      { key: 'pre1', name: 'pre1_name', isDefault: true, hide: false },
      { key: 'pre2', name: 'pre2_name', isDefault: true, hide: false },
      { name: 'pre3', power: 77, speed: 77 },
    ]);
  });
});
