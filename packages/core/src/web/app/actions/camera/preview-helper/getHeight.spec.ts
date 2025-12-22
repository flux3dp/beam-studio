import type { IDeviceInfo } from '@core/interfaces/IDevice';

import getHeight from './getHeight';

jest.mock('@core/app/constants/device-constants', () => ({
  WORKAREA_DEEP: {
    ado1: 40.5,
    fbb1b: 100,
  },
}));

const mockRawGetProbePos = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  rawGetProbePos: () => mockRawGetProbePos(),
}));

const mockGetPreviewHeight = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  getPreviewHeight: (...args) => mockGetPreviewHeight(...args),
}));

const mockUpdateMessage = jest.fn();
const mockCloseMessage = jest.fn();

const mockDevice = { model: 'ado1' } as IDeviceInfo;

describe('test getHeight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return height from device', async () => {
    mockRawGetProbePos.mockResolvedValue({ didAf: true, z: 10 });
    mockGetPreviewHeight.mockResolvedValue(10);

    const res = await getHeight(mockDevice, { closeMessage: mockCloseMessage, updateMessage: mockUpdateMessage });

    expect(res).toBe(30.5);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(0);
    expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenLastCalledWith('Getting probe position');
    expect(mockCloseMessage).toHaveBeenCalledTimes(0);
  });

  it('should return height from dialog', async () => {
    mockRawGetProbePos.mockRejectedValue(new Error('mock error'));
    mockGetPreviewHeight.mockResolvedValue(20);

    const res = await getHeight(mockDevice, { closeMessage: mockCloseMessage, updateMessage: mockUpdateMessage });

    expect(res).toBe(20);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenLastCalledWith({ initValue: undefined });
    expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenLastCalledWith('Getting probe position');
    expect(mockCloseMessage).toHaveBeenCalledTimes(1);
  });

  it('should return height from dialog with initValue', async () => {
    mockRawGetProbePos.mockRejectedValue(new Error('mock error'));
    mockGetPreviewHeight.mockResolvedValue(30);

    const res = await getHeight(mockDevice, { closeMessage: mockCloseMessage, updateMessage: mockUpdateMessage });

    expect(res).toBe(30);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenCalledTimes(1);
    expect(mockGetPreviewHeight).toHaveBeenLastCalledWith({ initValue: undefined });
    expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenLastCalledWith('Getting probe position');
    expect(mockCloseMessage).toHaveBeenCalledTimes(1);
  });
});
