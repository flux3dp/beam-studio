/* eslint-disable @typescript-eslint/no-explicit-any */
import FisheyePreviewManagerV1 from './FisheyePreviewManagerV1';

const mockGetWorkarea = jest.fn();
jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockEndRawMode = jest.fn();
const mockSet3dRotation = jest.fn();
const mockSetFisheyeMatrix = jest.fn();
jest.mock('helpers/device-master', () => ({
  endRawMode: (...args) => mockEndRawMode(...args),
  set3dRotation: (...args) => mockSet3dRotation(...args),
  setFisheyeMatrix: (...args) => mockSetFisheyeMatrix(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  update: (...args) => mockUpdate(...args),
  popById: (...args) => mockPopById(...args),
}));

jest.mock(
  './FisheyePreviewManagerBase',
  () =>
    class FisheyePreviewManagerBase {
      progressId = 'fisheye-preview-manager';
    }
);

const mockGetPerspectivePointsZ3Regression = jest.fn();
const mockInterpolatePointsFromHeight = jest.fn();
jest.mock('helpers/camera-calibration-helper', () => ({
  getPerspectivePointsZ3Regression: (...args) => mockGetPerspectivePointsZ3Regression(...args),
  interpolatePointsFromHeight: (...args) => mockInterpolatePointsFromHeight(...args),
}));

const mockGetAutoFocusPosition = jest.fn();
jest.mock(
  './getAutoFocusPosition',
  () =>
    (...args) =>
      mockGetAutoFocusPosition(...args)
);

const mockGetLevelingData = jest.fn();
jest.mock(
  './getLevelingData',
  () =>
    (...args) =>
      mockGetLevelingData(...args)
);

const mockGetHeight = jest.fn();
jest.mock(
  './getHeight',
  () =>
    (...args) =>
      mockGetHeight(...args)
);

const mockLoadCamera3dRotation = jest.fn();
jest.mock(
  './loadCamera3dRotation',
  () =>
    (...args) =>
      mockLoadCamera3dRotation(...args)
);

const mockRawAndHome = jest.fn();
jest.mock(
  './rawAndHome',
  () =>
    (...args) =>
      mockRawAndHome(...args)
);

jest.mock('helpers/i18n', () => ({
  lang: {
    message: {
      endingRawMode: 'endingRawMode',
      getProbePosition: 'getProbePosition',
    },
  },
}));

const mockLog = jest.fn();

describe('test FisheyePreviewManagerV1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.console.log = mockLog;
  });

  test('setupFisheyePreview', async () => {
    const device = {
      model: 'model-1',
    };
    const params = {
      heights: [1, 2],
      center: [3, 4],
      points: [[5, 6]],
    };
    mockGetHeight.mockResolvedValue(7);
    mockGetLevelingData
      .mockResolvedValue({ a: 8 })
      .mockResolvedValueOnce({ a: 9 })
      .mockResolvedValueOnce({ a: 10 });
    mockLoadCamera3dRotation.mockResolvedValue(null);
    mockGetAutoFocusPosition.mockResolvedValue('a');
    const mockOnObjectHeightChanged = jest.fn();
    const manager = new FisheyePreviewManagerV1(device as any, params as any);
    manager.onObjectHeightChanged = mockOnObjectHeightChanged;
    await manager.setupFisheyePreview();
    console.log(manager.setupFisheyePreview);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenNthCalledWith(1, { id: 'fisheye-preview-manager' });
    expect(mockOpenNonstopProgress).toHaveBeenNthCalledWith(2, {
      id: 'fisheye-preview-manager',
      message: 'getProbePosition',
    });
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'fisheye-preview-manager', {
      message: 'Fetching leveling data...',
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'fisheye-preview-manager', {
      message: 'getProbePosition',
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(3, 'fisheye-preview-manager', {
      message: 'endingRawMode',
    });
    expect(mockGetLevelingData).toHaveBeenCalledTimes(3);
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(1, 'hexa_platform');
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(2, 'bottom_cover');
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(3, 'offset');
    expect(mockLoadCamera3dRotation).toHaveBeenCalledTimes(1);
    expect(mockRawAndHome).toHaveBeenCalledTimes(1);
    expect(mockRawAndHome).toHaveBeenCalledWith('fisheye-preview-manager');
    expect(mockEndRawMode).toHaveBeenCalledTimes(1);
    expect(mockOnObjectHeightChanged).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledWith('fisheye-preview-manager');
  });

  test('onObjectHeightChanged', () => {
    const mockCalculatePerspectivePoints = jest.fn();
    const mockParams = {
      k: [1, 2],
      d: [3, 4],
      center: [[5, 6]],
    };
    const manager = new FisheyePreviewManagerV1({} as any, mockParams as any);
    manager.calculatePerspectivePoints = mockCalculatePerspectivePoints;
    mockCalculatePerspectivePoints.mockReturnValue('mockPerspectivePoints');
    manager.onObjectHeightChanged();
    expect(mockCalculatePerspectivePoints).toHaveBeenCalledTimes(1);
    expect(mockCalculatePerspectivePoints).toHaveBeenCalledWith();
    expect(mockSetFisheyeMatrix).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeMatrix).toHaveBeenCalledWith(
      {
        k: [1, 2],
        d: [3, 4],
        center: [[5, 6]],
        points: 'mockPerspectivePoints',
      },
      true
    );
  });

  test('update3dRotation', async () => {
    const mockDevice = { model: 'model-1' };
    const mockOnObjectHeightChanged = jest.fn();
    const manager = new FisheyePreviewManagerV1(mockDevice as any, {} as any);
    manager.objectHeight = 10;
    manager.rotationData = { dh: 10 } as any;
    manager.onObjectHeightChanged = mockOnObjectHeightChanged;
    mockGetWorkarea.mockReturnValue({ width: 430, height: 300, deep: 100 });
    await manager.update3DRotation({ rx: 1, ry: 2, rz: 3, sh: 4, ch: 5, dh: 20, tx: 0, ty: 0 });
    expect(mockGetWorkarea).toBeCalledTimes(1);
    expect(mockGetWorkarea).toBeCalledWith('model-1', 'ado1');
    expect(mockSet3dRotation).toHaveBeenCalledTimes(1);
    expect(mockSet3dRotation).toHaveBeenCalledWith({ rx: 1, ry: 2, rz: 3, h: 380, tx: 0, ty: 0 });
    expect(mockOnObjectHeightChanged).toHaveBeenCalledTimes(1);
  });

  test('calculatePerspectivePoints from interpolatePointsFromHeight', () => {
    const device = {
      model: 'model-1',
    };
    const params = {
      heights: [1, 2],
      center: [3, 4],
      points: [[5, 6]],
    };
    const manager = new FisheyePreviewManagerV1(device as any, params as any);
    manager.objectHeight = 7;
    manager.levelingData = { a: 8 };
    manager.levelingOffset = { a: 9 };
    manager.rotationData = { dh: 10 } as any;
    mockInterpolatePointsFromHeight.mockReturnValue([[11, 12]]);
    const result = manager.calculatePerspectivePoints();
    expect(result).toEqual([[11, 12]]);
    expect(mockInterpolatePointsFromHeight).toHaveBeenCalledTimes(1);
    expect(mockInterpolatePointsFromHeight).toHaveBeenCalledWith(17, [1, 2], [[5, 6]], {
      chessboard: [48, 36],
      workarea: [430, 300],
      center: [3, 4],
      levelingOffsets: { a: 17 },
    });
    expect(mockGetPerspectivePointsZ3Regression).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith('Use Height: ', 7);
    expect(mockLog).toHaveBeenCalledWith('After applying 3d rotation dh: ', 17);
  });

  test('calculatePerspectivePoints from getPerspectivePointsZ3Regression', () => {
    const device = {
      model: 'model-1',
    };
    const params = {
      z3regParam: [1, 2],
      center: [3, 4],
    };
    const manager = new FisheyePreviewManagerV1(device as any, params as any);
    manager.objectHeight = 7;
    manager.levelingData = { a: 8 };
    manager.levelingOffset = { a: 9 };
    manager.rotationData = { dh: 10 } as any;
    mockGetPerspectivePointsZ3Regression.mockReturnValue([[11, 12]]);
    const result = manager.calculatePerspectivePoints();
    expect(result).toEqual([[11, 12]]);
    expect(mockGetPerspectivePointsZ3Regression).toHaveBeenCalledTimes(1);
    expect(mockGetPerspectivePointsZ3Regression).toHaveBeenCalledWith(17, [1, 2], {
      chessboard: [48, 36],
      workarea: [430, 300],
      center: [3, 4],
      levelingOffsets: { a: 17 },
    });
    expect(mockInterpolatePointsFromHeight).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith('Use Height: ', 7);
    expect(mockLog).toHaveBeenCalledWith('After applying 3d rotation dh: ', 17);
  });
});
