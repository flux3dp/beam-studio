import { galvoDevDefaults } from '@core/app/constants/galvo-dev-settings';

import { getGalvoGantryFeedrateCap, getGalvoHeadConnection } from './galvoHeadConnection';

const mockGetDeviceDetailInfo = jest.fn();
const mockEndSubTask = jest.fn();

const mockStorageGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({ get: (...args: unknown[]) => mockStorageGet(...args) }));

jest.mock('../device-master', () => ({
  get currentControlMode() {
    return mockControlMode;
  },
  endSubTask: (...args: unknown[]) => mockEndSubTask(...args),
  getDeviceDetailInfo: (...args: unknown[]) => mockGetDeviceDetailInfo(...args),
}));

let mockControlMode = '';

describe('galvoHeadConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockControlMode = '';
  });

  it.each([
    [1, 0, 'disconnected'],
    [0, 1, 'connected'],
    // the machine does not trust these either, and docks from scratch when it sees them
    [0, 0, 'unknown'],
    [1, 1, 'unknown'],
  ])('reads cut_limit %s / galvo_limit %s as %s', async (cut, galvo, expected) => {
    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: cut, galvo_limit: galvo });

    expect(await getGalvoHeadConnection('fhx2galvo')).toBe(expected);
  });

  it('accepts the strings the control socket may hand back', async () => {
    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: '0', galvo_limit: '1' });

    expect(await getGalvoHeadConnection('fhx2galvo')).toBe('connected');
  });

  it('is unknown when the machine does not report the switches', async () => {
    mockGetDeviceDetailInfo.mockResolvedValue({ head_type: '1' });

    expect(await getGalvoHeadConnection('fhx2galvo')).toBe('unknown');
  });

  it('is unknown when the read fails, and never throws at the caller', async () => {
    mockGetDeviceDetailInfo.mockRejectedValue(new Error('timeout'));

    expect(await getGalvoHeadConnection('fhx2galvo')).toBe('unknown');
  });

  it('ends a lingering sub task, since deviceinfo is refused inside one', async () => {
    mockControlMode = 'raw';
    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: 1, galvo_limit: 0 });

    await getGalvoHeadConnection('fhx2galvo');

    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
  });

  it('asks nothing of a machine with no dock', async () => {
    expect(await getGalvoHeadConnection('fhx2rf')).toBe('disconnected');
    expect(await getGalvoGantryFeedrateCap('fhx2rf')).toBeUndefined();
    expect(mockGetDeviceDetailInfo).not.toHaveBeenCalled();
  });

  it('caps the feedrate at galvo_ts whenever a head may be connected', async () => {
    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: 0, galvo_limit: 1 });
    expect(await getGalvoGantryFeedrateCap('fhx2galvo')).toBe(galvoDevDefaults.galvo_ts);

    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: 0, galvo_limit: 0 });
    expect(await getGalvoGantryFeedrateCap('fhx2galvo')).toBe(galvoDevDefaults.galvo_ts);

    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: 1, galvo_limit: 0 });
    expect(await getGalvoGantryFeedrateCap('fhx2galvo')).toBeUndefined();
  });

  it('follows a galvo_ts the developer has overridden', async () => {
    mockStorageGet.mockReturnValue({ galvo_ts: 1200 });
    mockGetDeviceDetailInfo.mockResolvedValue({ cut_limit: 0, galvo_limit: 1 });

    expect(await getGalvoGantryFeedrateCap('fhx2galvo')).toBe(1200);
  });
});
