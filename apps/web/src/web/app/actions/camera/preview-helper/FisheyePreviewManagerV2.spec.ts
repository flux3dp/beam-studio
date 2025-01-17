/* eslint-disable @typescript-eslint/no-explicit-any */
import FisheyePreviewManagerV2 from './FisheyePreviewManagerV2';

const mockEndRawMode = jest.fn();
const mockSetFisheyeParam = jest.fn();
const mockSetFisheyeObjectHeight = jest.fn();
const mockSetFisheyeLevelingData = jest.fn();
jest.mock('helpers/device-master', () => ({
  endRawMode: (...args) => mockEndRawMode(...args),
  setFisheyeParam: (...args) => mockSetFisheyeParam(...args),
  setFisheyeObjectHeight: (...args) => mockSetFisheyeObjectHeight(...args),
  setFisheyeLevelingData: (...args) => mockSetFisheyeLevelingData(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  update: (...args) => mockUpdate(...args),
  popById: (...args) => mockPopById(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    message: {
      getProbePosition: 'getProbePosition',
      endingRawMode: 'endingRawMode',
    },
  },
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

const mockRawAndHome = jest.fn();
jest.mock(
  './rawAndHome',
  () =>
    (...args) =>
      mockRawAndHome(...args)
);

jest.mock(
  './FisheyePreviewManagerBase',
  () =>
    class FisheyePreviewManagerBase {
      progressId = 'fisheye-preview-manager';
    }
);

describe('test FisheyePreviewManagerV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test setupFisheyePreview', async () => {
    const device = { model: 'model' } as any;
    const params = 'params' as any;
    const mockOnObjectHeightChanged = jest.fn();
    const fisheyePreviewManagerV2 = new FisheyePreviewManagerV2(device, params);
    fisheyePreviewManagerV2.onObjectHeightChanged = mockOnObjectHeightChanged;
    mockGetLevelingData
      .mockResolvedValueOnce('mock-offset');
    mockRawAndHome.mockReturnValue('rawAndHome');
    mockGetHeight.mockReturnValue(7);
    mockGetAutoFocusPosition.mockReturnValue('autoFocusRefKey');
    const result = await fisheyePreviewManagerV2.setupFisheyePreview();
    expect(result).toBe(true);
    expect(fisheyePreviewManagerV2.levelingOffset).toBe('mock-offset');
    expect(fisheyePreviewManagerV2.objectHeight).toBe(7);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenNthCalledWith(1, { id: 'fisheye-preview-manager' });
    expect(mockOpenNonstopProgress).toHaveBeenNthCalledWith(2, {
      id: 'fisheye-preview-manager',
      message: 'getProbePosition',
    });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'fisheye-preview-manager', { message: 'Fetching leveling data...' });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'fisheye-preview-manager', { message: 'endingRawMode' });
    expect(mockGetLevelingData).toBeCalledTimes(1);
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(1, 'offset');
    expect(mockRawAndHome).toHaveBeenCalledTimes(1);
    expect(mockGetHeight).toHaveBeenCalledTimes(1);
    expect(mockGetAutoFocusPosition).toHaveBeenCalledTimes(1);
    expect(mockEndRawMode).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeParam).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeParam).toHaveBeenNthCalledWith(1, 'params');
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenNthCalledWith(1, 'fisheye-preview-manager');
    expect(mockOnObjectHeightChanged).toHaveBeenCalledTimes(1);
  });

  test('onObjectHeightChanged', () => {
    const fisheyePreviewManagerV2 = new FisheyePreviewManagerV2({} as any, { levelingData: { A: 8, E: 9 } } as any);
    fisheyePreviewManagerV2.autoFocusRefKey = 'A';
    fisheyePreviewManagerV2.objectHeight = 7;
    fisheyePreviewManagerV2.levelingOffset = { A: 0, E: 2 };
    fisheyePreviewManagerV2.onObjectHeightChanged();
    expect(mockSetFisheyeObjectHeight).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeObjectHeight).toHaveBeenNthCalledWith(1, 6);
  });
});
