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

import { getModuleOffsets, updateModuleOffsets } from './moduleOffsets';

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

  test('getModuleOffsets with default props', () => {
    expect(getModuleOffsets()).toEqual([1, 2]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsets with isRelative true', () => {
    expect(getModuleOffsets({ isRelative: true, module: LayerModule.LASER_1064 })).toEqual([5, -20.95]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsets with given offsets', () => {
    expect(getModuleOffsets({ offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22] } } })).toEqual([11, 22]);
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('getModuleOffsets with given workarea', () => {
    expect(getModuleOffsets({ module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual([11, 12]);
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });

  test('updateModuleOffsets with default options', () => {
    expect(updateModuleOffsets([1.5, 2.5])).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, true],
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

  test('updateModuleOffsets with isRelative true', () => {
    expect(updateModuleOffsets([1.5, 2.5], { isRelative: true, module: LayerModule.LASER_1064 })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [1.5, 29.45, true],
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

  test('updateModuleOffsets with shouldWrite true', () => {
    expect(updateModuleOffsets([1.5, 2.5], { shouldWrite: true })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, true],
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
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, true],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test('updateModuleOffsets with given offsets', () => {
    expect(
      updateModuleOffsets([1.5, 2.5], {
        offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22], [LayerModule.LASER_20W_DIODE]: [33, 44] } },
      }),
    ).toEqual({ ado1: { [LayerModule.LASER_10W_DIODE]: [1.5, 2.5, true], [LayerModule.LASER_20W_DIODE]: [33, 44] } });
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  test('updateModuleOffsets with given workarea', () => {
    expect(updateModuleOffsets([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [1.5, 2.5, true],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });

  test('updateModuleOffsets with new workarea key', () => {
    expect(updateModuleOffsets([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbb2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbb2: {
        [LayerModule.UV_WHITE_INK]: [1.5, 2.5, true],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockGetState).not.toHaveBeenCalled();
  });
});
