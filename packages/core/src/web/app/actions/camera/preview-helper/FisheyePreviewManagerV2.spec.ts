import FisheyePreviewManagerV2 from './FisheyePreviewManagerV2';

const mockEndSubTask = jest.fn();
const mockSetFisheyeParam = jest.fn();
const mockSetFisheyeObjectHeight = jest.fn();
const mockSetFisheyeLevelingData = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  endSubTask: (...args) => mockEndSubTask(...args),
  setFisheyeLevelingData: (...args) => mockSetFisheyeLevelingData(...args),
  setFisheyeObjectHeight: (...args) => mockSetFisheyeObjectHeight(...args),
  setFisheyeParam: (...args) => mockSetFisheyeParam(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    message: {
      endingRawMode: 'endingRawMode',
      getProbePosition: 'getProbePosition',
    },
  },
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

const mockRawAndHome = jest.fn();

jest.mock(
  './rawAndHome',
  () =>
    (...args) =>
      mockRawAndHome(...args),
);

jest.mock(
  './FisheyePreviewManagerBase',
  () =>
    class FisheyePreviewManagerBase {
      progressId = 'fisheye-preview-manager';
    },
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
    mockGetLevelingData.mockResolvedValueOnce('mock-offset');
    mockRawAndHome.mockReturnValue('rawAndHome');
    mockGetHeight.mockReturnValue(7);
    mockGetAutoFocusPosition.mockReturnValue('autoFocusRefKey');

    const mockUpdateMessage = jest.fn();
    const mockCloseMessage = jest.fn();
    const result = await fisheyePreviewManagerV2.setupFisheyePreview({
      closeMessage: mockCloseMessage,
      updateMessage: mockUpdateMessage,
    });

    expect(result).toBe(true);
    expect(fisheyePreviewManagerV2.levelingOffset).toBe('mock-offset');
    expect(fisheyePreviewManagerV2.objectHeight).toBe(7);
    expect(mockUpdateMessage).toHaveBeenCalledTimes(3);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(1, 'Fetching leveling data...');
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(2, 'getProbePosition');
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(3, 'endingRawMode');
    expect(mockGetLevelingData).toHaveBeenCalledTimes(1);
    expect(mockGetLevelingData).toHaveBeenNthCalledWith(1, 'offset');
    expect(mockRawAndHome).toHaveBeenCalledTimes(1);
    expect(mockGetHeight).toHaveBeenCalledTimes(1);
    expect(mockGetAutoFocusPosition).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeParam).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeParam).toHaveBeenNthCalledWith(1, 'params');
    expect(mockCloseMessage).toHaveBeenCalledTimes(1);
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
