import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockRead = jest.fn();
const mockWrite = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: mockRead,
  write: mockWrite,
}));

let mockPreference: Record<string, any>;

import { getModuleOffsets, updateModuleOffsets } from './moduleOffsets';

describe('test moduleOffsets helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPreference = {
      'module-offsets': {
        ado1: {
          [LayerModule.LASER_10W_DIODE]: [1, 2],
          [LayerModule.LASER_1064]: [5, 6],
        },
        fbm2: {
          [LayerModule.UV_WHITE_INK]: [11, 12],
        },
      },
      workarea: 'ado1',
    };
    mockRead.mockImplementation((key) => mockPreference[key]);
  });

  test('getModuleOffsets with default props', () => {
    expect(getModuleOffsets()).toEqual([1, 2]);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'workarea');
  });

  test('getModuleOffsets with useRealValue false', () => {
    expect(getModuleOffsets({ module: LayerModule.LASER_1064, useRealValue: false })).toEqual([5, -20.95]);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'workarea');
  });

  test('getModuleOffsets with given offsets', () => {
    expect(getModuleOffsets({ offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22] } } })).toEqual([11, 22]);
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
  });

  test('getModuleOffsets with given workarea', () => {
    expect(getModuleOffsets({ module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual([11, 12]);
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  });

  test('updateModuleOffsets with default options', () => {
    expect(updateModuleOffsets([1.5, 2.5])).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'workarea');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  test('updateModuleOffsets with isRealValue true', () => {
    expect(updateModuleOffsets([1.5, 2.5], { isRealValue: true, module: LayerModule.LASER_1064 })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [1.5, 2.5],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'workarea');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  test('updateModuleOffsets with shouldWrite true', () => {
    expect(updateModuleOffsets([1.5, 2.5], { shouldWrite: true })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
    expect(mockRead).toHaveBeenNthCalledWith(2, 'workarea');
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'module-offsets', {
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1.5, 2.5],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
  });

  test('updateModuleOffsets with given offsets', () => {
    expect(
      updateModuleOffsets([1.5, 2.5], {
        offsets: { ado1: { [LayerModule.LASER_10W_DIODE]: [11, 22], [LayerModule.LASER_20W_DIODE]: [33, 44] } },
      }),
    ).toEqual({ ado1: { [LayerModule.LASER_10W_DIODE]: [1.5, 2.5], [LayerModule.LASER_20W_DIODE]: [33, 44] } });
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'workarea');
  });

  test('updateModuleOffsets with given workarea', () => {
    expect(updateModuleOffsets([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [0.8, -20.3],
      },
    });
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  });

  test('updateModuleOffsets with new workarea key', () => {
    expect(updateModuleOffsets([1.5, 2.5], { module: LayerModule.UV_WHITE_INK, workarea: 'fbb2' })).toEqual({
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [1, 2],
        [LayerModule.LASER_1064]: [5, 6],
      },
      fbb2: {
        [LayerModule.UV_WHITE_INK]: [1.5, 2.5],
      },
      fbm2: {
        [LayerModule.UV_WHITE_INK]: [11, 12],
      },
    });
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  });
});
