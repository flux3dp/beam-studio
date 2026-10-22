import { LaserType } from '@core/app/constants/promark-constants';

import { getInitialCameraRotation, isCameraRotated } from './camera-rotation';

const mockGet = jest.fn();

jest.mock('./promark-data-store', () => ({
  get: (...args) => mockGet(...args),
}));

const params = { d: [[0]], k: [[0]], rvec: [[0]], tvec: [[0]], v: 3 as const };

const mockStore = (store: Record<string, unknown>) => {
  mockGet.mockImplementation((_serial: string, key: string) => store[key]);
};

describe('test camera-rotation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('parameters saved before the flag existed are rotated', () => {
    expect(isCameraRotated(params)).toBe(true);
  });

  test('stored flag wins', () => {
    expect(isCameraRotated({ ...params, rotate180: false })).toBe(false);
    expect(isCameraRotated({ ...params, rotate180: true })).toBe(true);
  });

  test('calibrated machine ignores the laser source', () => {
    mockStore({ cameraParameters: params, info: { laserType: LaserType.UV, watt: 5 } });
    expect(getInitialCameraRotation('123')).toBe(true);
    expect(mockGet).toHaveBeenCalledWith('123', 'cameraParameters');

    mockStore({ cameraParameters: { ...params, rotate180: false }, info: { laserType: LaserType.Desktop, watt: 20 } });
    expect(getInitialCameraRotation('123')).toBe(false);
  });

  test('uncalibrated machine guesses from the laser source', () => {
    mockStore({ info: { laserType: LaserType.UV, watt: 5 } });
    expect(getInitialCameraRotation('123')).toBe(false);

    mockStore({ info: { laserType: LaserType.MOPA, watt: 60 } });
    expect(getInitialCameraRotation('123')).toBe(true);

    mockStore({});
    expect(getInitialCameraRotation('123')).toBe(true);
  });
});
