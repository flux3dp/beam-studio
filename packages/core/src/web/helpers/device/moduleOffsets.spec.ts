import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: mockGetState },
}));

const mockGetGlobalPreference = jest.fn();
const mockSet = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: mockGetGlobalPreference,
  },
}));

const mockUpdate = jest.fn();

jest.mock('@core/app/actions/canvas/boundaryDrawer', () => ({ boundaryDrawer: { update: mockUpdate } }));

const mockGetCurrentDevice = jest.fn();
const mockGetDeviceSetting = jest.fn();
const mockSetDeviceSetting = jest.fn();

jest.mock('../device-master', () => ({
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  getDeviceSetting: mockGetDeviceSetting,
  setDeviceSetting: mockSetDeviceSetting,
}));

import {
  getAllOffsets,
  getAllOffsetsFromDevices,
  getModuleOffsets,
  getModuleOffsetsFromDevices,
  getModuleOffsetsFromStore,
  updateModuleOffsets,
  updateModuleOffsetsInDevice,
  updateModuleOffsetsInStore,
} from './moduleOffsets';

describe('test moduleOffsets helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    mockGetGlobalPreference.mockReturnValue({
      'module-offsets': {
        ado1: {
          [LayerModule.LASER_10W_DIODE]: [1, 2],
          [LayerModule.LASER_1064]: [5, 6],
        },
        fbm2: {
          [LayerModule.UV_WHITE_INK]: [11, 12],
        },
      },
      set: mockSet,
    });
  });

  test('getModuleOffsetsFromStore with default props', () => {
    expect(getModuleOffsetsFromStore()).toEqual([1, 2]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsetsFromStore with isRelative true', () => {
    expect(getModuleOffsetsFromStore({ isRelative: true, module: LayerModule.LASER_1064 })).toEqual([5, -20.95]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsetsFromStore with given offsets', () => {
    expect(getModuleOffsetsFromStore({ offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22] } } })).toEqual([
      11, 22,
    ]);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsetsFromStore with given workarea', () => {
    expect(getModuleOffsetsFromStore({ module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual([11, 12]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });

  test('updateModuleOffsetsInStore with default options', () => {
    expect(updateModuleOffsetsInStore([1.5, 2.5])).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, 1],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('updateModuleOffsetsInStore with isRelative true', () => {
    expect(updateModuleOffsetsInStore([1.5, 2.5], { isRelative: true, module: LayerModule.LASER_1064 })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [1.5, 29.45, 1],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('updateModuleOffsetsInStore with shouldWrite true', () => {
    expect(updateModuleOffsetsInStore([1.5, 2.5], { shouldWrite: true })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, 1],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    // 1 for module-offsets, 1 for set
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(2);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'module-offsets', {
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, 1],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test('updateModuleOffsetsInStore with given offsets', () => {
    expect(
      updateModuleOffsetsInStore([1.5, 2.5], {
        offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22], [LayerModule.LASER_20W_DIODE]: [33, 44] } },
      }),
    ).toEqual({ ado1: { [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, 1], [LayerModule.LASER_20W_DIODE]: [33, 44] } });
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('updateModuleOffsetsInStore with given workarea', () => {
    expect(updateModuleOffsetsInStore([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [1.5, 2.5, 1],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });

  test('updateModuleOffsetsInStore with new workarea key', () => {
    expect(updateModuleOffsetsInStore([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbb2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbb2: {
        [LayerModule.UV_WHITE_INK]: [1.5, 2.5, 1],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });

  describe('getAllOffsetsFromDevices', () => {
    test('should return null when no current device', async () => {
      mockGetCurrentDevice.mockReturnValue(null);

      const result = await getAllOffsetsFromDevices();

      expect(result).toBeNull();
    });

    test('should return null when device model is not supported', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'ado1', uuid: 'test-uuid' },
      });

      const result = await getAllOffsetsFromDevices();

      expect(result).toBeNull();
    });

    test('should return cached offsets when useCache is true', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      // First call to populate cache
      mockGetDeviceSetting.mockResolvedValue({
        value: JSON.stringify({
          LASER_10W_DIODE: [1, 2, 1],
          UV_WHITE_INK: [3, 4, 0],
        }),
      });

      let result = await getAllOffsetsFromDevices(false);

      expect(result).toEqual({
        [LayerModule.LASER_10W_DIODE]: [1, 2, 1],
        [LayerModule.UV_WHITE_INK]: [3, 4, 0],
      });
      expect(mockGetDeviceSetting).toHaveBeenCalledTimes(1);

      // Second call should use cache
      result = await getAllOffsetsFromDevices(true);

      expect(result).toEqual({
        [LayerModule.LASER_10W_DIODE]: [1, 2, 1],
        [LayerModule.UV_WHITE_INK]: [3, 4, 0],
      });
      expect(mockGetDeviceSetting).toHaveBeenCalledTimes(1);
    });

    test('should return null and log error when device setting fails', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockGetDeviceSetting.mockRejectedValue(new Error('Device error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getAllOffsetsFromDevices(false);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get module offsets from device', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getModuleOffsetsFromDevices', () => {
    test('should return null when getAllOffsetsFromDevices returns null', async () => {
      mockGetCurrentDevice.mockReturnValue(null);

      const result = await getModuleOffsetsFromDevices(LayerModule.LASER_10W_DIODE);

      expect(result).toBeNull();
    });

    test('should return specific module offset when available', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockGetDeviceSetting.mockResolvedValue({
        value: JSON.stringify({
          LASER_10W_DIODE: [7, 8, 1],
          UV_WHITE_INK: [9, 10, 0],
        }),
      });

      const result = await getModuleOffsetsFromDevices(LayerModule.LASER_10W_DIODE, { useCache: false });

      expect(result).toEqual([7, 8, 1]);
    });
  });

  describe('updateModuleOffsetsInDevice', () => {
    test('should return false when no current device', async () => {
      mockGetCurrentDevice.mockReturnValue(null);

      const result = await updateModuleOffsetsInDevice([1, 2]);

      expect(result).toBe(false);
    });

    test('should return false when device model is not supported', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'ado1', uuid: 'test-uuid' },
      });

      const result = await updateModuleOffsetsInDevice([1, 2]);

      expect(result).toBe(false);
    });

    test('should return false when no module specified', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      const result = await updateModuleOffsetsInDevice([1, 2]);

      expect(result).toBe(false);
    });

    test('should update device setting with absolute offsets', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockSetDeviceSetting.mockResolvedValue('success');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await updateModuleOffsetsInDevice([1.5, 2.5], {
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'fbm2',
      });

      expect(result).toBe(true);
      expect(mockSetDeviceSetting).toHaveBeenCalledWith('toolhead_shift', '{\\\\\\"LASER_10W_DIODE\\\\\\":[1.5,2.5]}');
      expect(consoleSpy).toHaveBeenCalledWith('success');

      consoleSpy.mockRestore();
    });

    test('should update device setting with relative offsets', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockSetDeviceSetting.mockResolvedValue('success');

      const result = await updateModuleOffsetsInDevice([1, 2], {
        isRelative: true,
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'fbm2',
      });

      expect(result).toBe(true);
      expect(mockSetDeviceSetting).toHaveBeenCalledWith('toolhead_shift', expect.stringContaining('LASER_10W_DIODE'));
    });

    test('should use device model as workarea when not specified', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockSetDeviceSetting.mockResolvedValue('success');

      const result = await updateModuleOffsetsInDevice([1, 2], {
        module: LayerModule.LASER_10W_DIODE,
      });

      expect(result).toBe(true);
      expect(mockSetDeviceSetting).toHaveBeenCalled();
    });

    test('should round numeric values in JSON', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockSetDeviceSetting.mockResolvedValue('success');

      const result = await updateModuleOffsetsInDevice([1.12345, 2.6789], {
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'fbm2',
      });

      expect(result).toBe(true);
      expect(mockSetDeviceSetting).toHaveBeenCalledWith(
        'toolhead_shift',
        '{\\\\\\"LASER_10W_DIODE\\\\\\":[1.12,2.68]}',
      );
    });
  });

  describe('getAllOffsets', () => {
    test('should return device offsets for fbm2 model when device is available', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockGetDeviceSetting.mockResolvedValue({
        value: JSON.stringify({
          LASER_10W_DIODE: [7, 8, 1],
          UV_WHITE_INK: [9, 10, 0],
        }),
      });

      const result = await getAllOffsets('fbm2', { useCache: false });

      expect(result).toEqual({
        [LayerModule.LASER_10W_DIODE]: [7, 8, 1],
        [LayerModule.UV_WHITE_INK]: [9, 10, 0],
      });
      expect(mockGetDeviceSetting).toHaveBeenCalledTimes(1);
    });

    test('should return default offsets for fbm2 model when device fails', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockGetDeviceSetting.mockRejectedValue(new Error('Device error'));

      const result = await getAllOffsets('fbm2', { useCache: false });

      expect(result).toEqual({
        [LayerModule.LASER_1064]: [81.4, 7.9],
        [LayerModule.LASER_UNIVERSAL]: [0, 0],
        [LayerModule.PRINTER_4C]: [15.5, -37.1],
        [LayerModule.UV_VARNISH]: [30.2, -1.1],
        [LayerModule.UV_WHITE_INK]: [19.7, -1.1],
      });
    });

    test('should return store offsets for non-fbm2 models', async () => {
      const result = await getAllOffsets('ado1');

      expect(result).toEqual({
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      });
      expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModuleOffsets', () => {
    test('should return device offsets for fbm2 model', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockGetDeviceSetting.mockResolvedValue({
        value: JSON.stringify({
          LASER_10W_DIODE: [15, 25, 1],
        }),
      });

      const result = await getModuleOffsets({
        module: LayerModule.LASER_10W_DIODE,
        useCache: false,
        workarea: 'fbm2',
      });

      expect(result).toEqual([15, 25, 1]);
    });

    test('should return default offsets for fbm2 when device returns null', async () => {
      mockGetCurrentDevice.mockReturnValue(null);

      const result = await getModuleOffsets({
        module: LayerModule.LASER_10W_DIODE,
        useCache: false,
        workarea: 'fbm2',
      });

      expect(result).toEqual([0, 0]);
    });

    test('should return store offsets for non-fbm2 models', async () => {
      const result = await getModuleOffsets({
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'ado1',
      });

      expect(result).toEqual([1, 2]);
    });

    test('should return relative offsets when isRelative is true', async () => {
      const result = await getModuleOffsets({
        isRelative: true,
        module: LayerModule.LASER_1064,
        workarea: 'ado1',
      });

      expect(result).toEqual([5, -20.95]);
    });

    test('should use default parameters when none provided', async () => {
      const result = await getModuleOffsets();

      expect(result).toEqual([1, 2]);
    });
  });

  describe('updateModuleOffsets', () => {
    test('should update device offsets for fbm2 model', async () => {
      mockGetCurrentDevice.mockReturnValue({
        info: { model: 'fbm2', uuid: 'test-uuid' },
      });

      mockSetDeviceSetting.mockResolvedValue('success');

      const result = await updateModuleOffsets([3, 4], {
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'fbm2',
      });

      expect(result).toBe(true);
      expect(mockSetDeviceSetting).toHaveBeenCalledWith('toolhead_shift', '{\\\\\\"LASER_10W_DIODE\\\\\\":[3,4]}');
    });

    test('should update store offsets for non-fbm2 models', async () => {
      const result = await updateModuleOffsets([5, 6], {
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'ado1',
      });

      expect(result).toBe(true);
      expect(mockGetGlobalPreference).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test('should handle undefined workarea by using current document workarea', async () => {
      const result = await updateModuleOffsets([7, 8], {
        module: LayerModule.LASER_10W_DIODE,
      });

      expect(result).toBe(true);
      expect(mockGetState).toHaveBeenCalledTimes(1);
    });

    test('should return false when device update fails', async () => {
      mockGetCurrentDevice.mockReturnValue(null);

      const result = await updateModuleOffsets([1, 2], {
        module: LayerModule.LASER_10W_DIODE,
        workarea: 'fbm2',
      });

      expect(result).toBe(false);
    });
  });
});
