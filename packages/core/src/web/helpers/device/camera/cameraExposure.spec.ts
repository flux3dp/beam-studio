const mockGetCurrentControlMode = jest.fn();
const mockGetCurrentDevice = jest.fn();
const mockEndSubTask = jest.fn();
const mockGetCameraExposure = jest.fn();
const mockGetDeviceSetting = jest.fn();
const mockSetCameraExposure = jest.fn();
const mockSetDeviceSetting = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  endSubTask: mockEndSubTask,
  getCameraExposure: mockGetCameraExposure,
  getDeviceSetting: mockGetDeviceSetting,
  setCameraExposure: mockSetCameraExposure,
  setDeviceSetting: mockSetDeviceSetting,
}));

const mockVersionChecker = jest.fn();

jest.mock('@core/helpers/version-checker', () => mockVersionChecker);

import { getExposureSettings, setExposure } from './cameraExposure';

describe('test cameraExposure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getExposureSettings in raw mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockGetCurrentDevice.mockReturnValue({
      info: { version: '6.1.0' },
    });
    mockGetCameraExposure.mockResolvedValue({ data: 123, success: true });
    mockVersionChecker.mockReturnValue({
      meetRequirement: () => true,
    });

    const res = await getExposureSettings();

    expect(res).toEqual({ max: 1000, min: 50, step: 1, value: 123 });
    expect(mockVersionChecker).toHaveBeenCalledWith('6.1.0');
    expect(mockEndSubTask).not.toHaveBeenCalled();
    expect(mockGetCameraExposure).toHaveBeenCalledTimes(1);
  });

  test('getExposureSettings in raw mode but not support', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockGetCurrentDevice.mockReturnValue({
      info: { version: '6.0.0' },
    });
    mockVersionChecker.mockReturnValue({
      meetRequirement: () => false,
    });
    mockGetDeviceSetting.mockResolvedValue({
      value: '{"data_type": "int", "min": 50, "default": 166, "max": 10000, "value": 450, "step": 1}',
    });

    const res = await getExposureSettings();

    expect(res).toEqual({ data_type: 'int', default: 166, max: 10000, min: 50, step: 1, value: 450 });
    expect(mockVersionChecker).toHaveBeenCalledWith('6.0.0');
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockGetCameraExposure).not.toHaveBeenCalled();
  });

  test('setExposure in raw mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockGetCurrentDevice.mockReturnValue({
      info: { version: '6.1.0' },
    });
    mockVersionChecker.mockReturnValue({
      meetRequirement: () => true,
    });
    await setExposure(200);
    expect(mockSetCameraExposure).toHaveBeenCalledWith(200);
    expect(mockSetDeviceSetting).not.toHaveBeenCalled();
  });

  test('setExposure in normal mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('other');
    mockGetCurrentDevice.mockReturnValue({
      info: { version: '6.1.0' },
    });
    await setExposure(200);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockSetDeviceSetting).toHaveBeenCalledWith('camera_exposure_absolute', '200');
    expect(mockSetCameraExposure).not.toHaveBeenCalled();
  });
});
