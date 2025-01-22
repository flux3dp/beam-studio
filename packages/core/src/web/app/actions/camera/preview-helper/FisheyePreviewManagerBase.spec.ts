import FisheyePreviewManagerBase from './FisheyePreviewManagerBase';

const mockGetCurrentControlMode = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockEndRawMode = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  endRawMode: (...args) => mockEndRawMode(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
}));

const mockGetLevelingData = jest.fn();

jest.mock(
  './getLevelingData',
  () =>
    (...args) =>
      mockGetLevelingData(...args),
);

const mockGetPreviewHeight = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  getPreviewHeight: (...args) => mockGetPreviewHeight(...args),
}));

const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    message: {
      endingRawMode: 'endingRawMode',
    },
  },
}));

describe('test FisheyePreviewManagerBase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work for reloadLevelingOffset', async () => {
    const manager = new FisheyePreviewManagerBase();

    mockGetLevelingData.mockResolvedValue({ x: 1, y: 2, z: 3 });
    try {
      await manager.reloadLevelingOffset();
    } catch (e) {
      expect(e.message).toBe('Method not implemented.');
    }
    expect(mockGetLevelingData).toHaveBeenCalledTimes(1);
    expect(mockGetLevelingData).toHaveBeenLastCalledWith('offset');
    expect(manager.levelingOffset).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('should work for resetObjectHeight', async () => {
    const manager = new FisheyePreviewManagerBase();

    mockGetPreviewHeight.mockResolvedValue(10);
    mockGetCurrentControlMode.mockReturnValue('raw');
    try {
      await manager.resetObjectHeight();
    } catch (e) {
      expect(e.message).toBe('Method not implemented.');
    }
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenLastCalledWith({ initValue: undefined });
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockEndRawMode).toHaveBeenCalledTimes(1);
    expect(manager.objectHeight).toBe(10);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith('fisheye-preview-manager', {
      message: 'endingRawMode',
    });
  });
});
