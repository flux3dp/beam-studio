import { LaserType } from '@core/app/constants/promark-constants';

import { getPromarkInfo, setPromarkInfo } from './promark-info';

const mockStorageGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockGetSelectedDevice = jest.fn();

jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: () => mockGetSelectedDevice(),
}));

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('./promark-data-store', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

describe('test promark-info', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get with top controller device', () => {
    mockGetSelectedDevice.mockReturnValue({ model: 'fpm1', serial: '123' });
    mockGet.mockReturnValue({ laserType: LaserType.MOPA, watt: 30 });
    expect(getPromarkInfo()).toEqual({ laserType: LaserType.MOPA, watt: 30 });
    expect(mockGetSelectedDevice).toBeCalledTimes(1);
    expect(mockStorageGet).not.toBeCalled();
    expect(mockGet).toBeCalledTimes(1);
    expect(mockGet).toBeCalledWith('123', 'info');
  });

  test('get with storage', () => {
    mockGetSelectedDevice.mockReturnValue({ model: 'fbm1', serial: '123' });
    mockStorageGet.mockReturnValue('456');
    mockGet.mockReturnValue({ laserType: LaserType.MOPA, watt: 50 });
    expect(getPromarkInfo()).toEqual({ laserType: LaserType.MOPA, watt: 50 });
    expect(mockGetSelectedDevice).toBeCalledTimes(1);
    expect(mockStorageGet).toBeCalledTimes(1);
    expect(mockStorageGet).toBeCalledWith('last-promark-serial');
    expect(mockGet).toBeCalledTimes(1);
    expect(mockGet).toBeCalledWith('456', 'info');
  });

  test('get with no serial', () => {
    mockGetSelectedDevice.mockReturnValue({ model: 'fbm1', serial: '123' });
    mockStorageGet.mockReturnValue(null);
    mockGet.mockReturnValue({ laserType: LaserType.Desktop, watt: 50 });
    expect(getPromarkInfo()).toEqual({ laserType: LaserType.Desktop, watt: 50 });
    expect(mockGetSelectedDevice).toBeCalledTimes(1);
    expect(mockStorageGet).toBeCalledTimes(1);
    expect(mockStorageGet).toBeCalledWith('last-promark-serial');
    expect(mockGet).toBeCalledTimes(1);
    expect(mockGet).toBeCalledWith('no-serial', 'info');
  });

  test('set data', () => {
    mockGetSelectedDevice.mockReturnValue({ model: 'fpm1', serial: '123' });
    setPromarkInfo({ laserType: LaserType.Desktop, watt: 30 });
    expect(mockGetSelectedDevice).toBeCalledTimes(1);
    expect(mockSet).toBeCalledTimes(1);
    expect(mockSet).toBeCalledWith('123', 'info', { laserType: LaserType.Desktop, watt: 30 });
  });
});
