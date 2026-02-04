import FisheyePreviewManagerV1 from './FisheyePreviewManagerV1';

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockEndSubTask = jest.fn();
const mockSet3dRotation = jest.fn();
const mockSetFisheyeMatrix = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  endSubTask: (...args) => mockEndSubTask(...args),
  set3dRotation: (...args) => mockSet3dRotation(...args),
  setFisheyeMatrix: (...args) => mockSetFisheyeMatrix(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

jest.mock(
  './FisheyePreviewManagerBase',
  () =>
    class FisheyePreviewManagerBase {
      progressId = 'fisheye-preview-manager';
    },
);

const mockGetPerspectivePointsZ3Regression = jest.fn();
const mockInterpolatePointsFromHeight = jest.fn();

jest.mock('@core/helpers/camera-calibration-helper', () => ({
  getPerspectivePointsZ3Regression: (...args) => mockGetPerspectivePointsZ3Regression(...args),
  interpolatePointsFromHeight: (...args) => mockInterpolatePointsFromHeight(...args),
}));

const mockGetAutoFocusPosition = jest.fn();

jest.mock(
  './getAutoFocusPosition',
  () =>
    (...args) =>
      mockGetAutoFocusPosition(...args),
);

const mockGetLevelingData = jest.fn();

jest.mock(
  './getLevelingData',
  () =>
    (...args) =>
      mockGetLevelingData(...args),
);

const mockGetHeight = jest.fn();

jest.mock(
  './getHeight',
  () =>
    (...args) =>
      mockGetHeight(...args),
);

const mockLoadCamera3dRotation = jest.fn();

jest.mock(
  './loadCamera3dRotation',
  () =>
    (...args) =>
      mockLoadCamera3dRotation(...args),
);

const mockRawAndHome = jest.fn();

jest.mock(
  './rawAndHome',
  () =>
    (...args) =>
      mockRawAndHome(...args),
);

jest.mock('@core/helpers/i18n', () => ({
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
      center: [3, 4],
      heights: [1, 2],
      points: [[5, 6]],
    };

    mockGetHeight.mockResolvedValue(7);
    mockGetLevelingData.mockResolvedValue({ a: 8 }).mockResolvedValueOnce({ a: 9 }).mockResolvedValueOnce({ a: 10 });
    mockLoadCamera3dRotation.mockResolvedValue(null);
    mockGetAutoFocusPosition.mockResolvedValue('a');

    const mockOnObjectHeightChanged = jest.fn();
    const manager = new FisheyePreviewManagerV1(device as any, params as any);

    manager.onObjectHeightChanged = mockOnObjectHeightChanged;

    const mockUpdateMessage = jest.fn();
    const mockCloseMessage = jest.fn();

    await manager.setupFisheyePreview({ closeMessage: mockCloseMessage, updateMessage: mockUpdateMessage });
    console.log(manager.setupFisheyePreview);
    expect(mockUpdateMessage).toHaveBeenCalledTimes(4);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(1, 'Fetching leveling data...');
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(2, 'getProbePosition');
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(3, 'getProbePosition');
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(4, 'endingRawMode');
    expect(mockGetLevelingData).toHaveBeenCalledTimes(3);
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(1, 'hexa_platform');
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(2, 'bottom_cover');
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(3, 'offset');
    expect(mockLoadCamera3dRotation).toHaveBeenCalledTimes(1);
    expect(mockRawAndHome).toHaveBeenCalledTimes(1);
    expect(mockRawAndHome).toHaveBeenCalledWith(mockUpdateMessage);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockOnObjectHeightChanged).toHaveBeenCalledTimes(1);
    expect(mockCloseMessage).toHaveBeenCalledTimes(1);
  });

  test('onObjectHeightChanged', () => {
    const mockCalculatePerspectivePoints = jest.fn();
    const mockParams = {
      center: [[5, 6]],
      d: [3, 4],
      k: [1, 2],
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
        center: [[5, 6]],
        d: [3, 4],
        k: [1, 2],
        points: 'mockPerspectivePoints',
      },
      true,
    );
  });

  test('update3dRotation', async () => {
    const mockDevice = { model: 'model-1' };
    const mockOnObjectHeightChanged = jest.fn();
    const manager = new FisheyePreviewManagerV1(mockDevice as any, {} as any);

    manager.objectHeight = 10;
    manager.rotationData = { dh: 10 } as any;
    manager.onObjectHeightChanged = mockOnObjectHeightChanged;
    mockGetWorkarea.mockReturnValue({ deep: 100, height: 300, width: 430 });
    await manager.update3DRotation({ ch: 5, dh: 20, rx: 1, ry: 2, rz: 3, sh: 4, tx: 0, ty: 0 });
    expect(mockGetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenCalledWith('model-1', 'ado1');
    expect(mockSet3dRotation).toHaveBeenCalledTimes(1);
    expect(mockSet3dRotation).toHaveBeenCalledWith({ h: 380, rx: 1, ry: 2, rz: 3, tx: 0, ty: 0 });
    expect(mockOnObjectHeightChanged).toHaveBeenCalledTimes(1);
  });

  test('calculatePerspectivePoints from interpolatePointsFromHeight', () => {
    const device = {
      model: 'model-1',
    };
    const params = {
      center: [3, 4],
      heights: [1, 2],
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
      center: [3, 4],
      chessboard: [48, 36],
      levelingOffsets: { a: 17 },
      workarea: [430, 300],
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
      center: [3, 4],
      z3regParam: [1, 2],
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
      center: [3, 4],
      chessboard: [48, 36],
      levelingOffsets: { a: 17 },
      workarea: [430, 300],
    });
    expect(mockInterpolatePointsFromHeight).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith('Use Height: ', 7);
    expect(mockLog).toHaveBeenCalledWith('After applying 3d rotation dh: ', 17);
  });
});
