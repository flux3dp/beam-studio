import { IDeviceInfo } from 'interfaces/IDevice';
import getHeight from './getHeight';

jest.mock('app/constants/device-constants', () => ({
  WORKAREA_DEEP: {
    ado1: 40.5,
    fbb1b: 100,
  },
}));

const mockRawGetProbePos = jest.fn();
jest.mock('helpers/device-master', () => ({
  rawGetProbePos: () => mockRawGetProbePos(),
}));

const mockGetPreviewHeight = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  getPreviewHeight: (...args) => mockGetPreviewHeight(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  update: (...args) => mockUpdate(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockDevice = { model: 'ado1' } as IDeviceInfo;

describe('test getHeight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return height from device', async () => {
    mockRawGetProbePos.mockResolvedValue({ z: 10, didAf: true });
    mockGetPreviewHeight.mockResolvedValue(10);
    const res = await getHeight(mockDevice);
    expect(res).toBe(30.5);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(0);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({ id: 'get-height' });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith('get-height', { message: 'Getting probe position' });
    expect(mockPopById).toHaveBeenCalledTimes(0);
  });

  it('should return height from dialog', async () => {
    mockRawGetProbePos.mockRejectedValue(new Error('mock error'));
    mockGetPreviewHeight.mockResolvedValue(20);
    const res = await getHeight(mockDevice);
    expect(res).toBe(20);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenLastCalledWith({ initValue: undefined });
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({ id: 'get-height' });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith('get-height', { message: 'Getting probe position' });
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenLastCalledWith('get-height');
  });

  it('should return height from dialog with initValue', async () => {
    mockRawGetProbePos.mockRejectedValue(new Error('mock error'));
    mockGetPreviewHeight.mockResolvedValue(30);
    const res = await getHeight(mockDevice, 'progress-id');
    expect(res).toBe(30);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenLastCalledWith({ initValue: undefined });
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(0);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith('progress-id', { message: 'Getting probe position' });
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenLastCalledWith('progress-id');
  });
});

