import type { IDeviceInfo } from '@core/interfaces/IDevice';
import checkFirmware from './checkFirmware';

const mockGet = jest.fn();

jest.mock('./api/flux-id', () => ({
  axiosFluxId: {
    get: (...args) => mockGet(...args),
  },
}));

describe('checkFirmware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
  });

  test('check b-series firmware', async () => {
    mockGet.mockResolvedValueOnce({ data: { links: [['BeamboxFirmware 1.0.1', 'mock-url']] } });

    const result = await checkFirmware({ model: 'fbm1', version: '1.0.0' } as IDeviceInfo);

    expect(result).toEqual({
      changelog_en: 'BeamboxFirmware 1.0.1',
      changelog_zh: 'BeamboxFirmware 1.0.1',
      downloadUrl: 'mock-url',
      latestVersion: '1.0.1',
      needUpdate: true,
    });
    expect(mockGet).toHaveBeenCalledWith('api/check-update?key=firmware-latest');
  });

  test('check b-series no need update', async () => {
    mockGet.mockResolvedValueOnce({ data: { links: [['BeamboxFirmware 1.0.0', 'mock-url']] } });

    const result = await checkFirmware({ model: 'fbm1', version: '1.0.0' } as IDeviceInfo);

    expect(result).toEqual({
      changelog_en: 'BeamboxFirmware 1.0.0',
      changelog_zh: 'BeamboxFirmware 1.0.0',
      downloadUrl: 'mock-url',
      latestVersion: '1.0.0',
      needUpdate: false,
    });
    expect(mockGet).toHaveBeenCalledWith('api/check-update?key=firmware-latest');
  });

  test('check ador firmware', async () => {
    mockGet.mockResolvedValueOnce({ data: { links: [['AdorFirmware 1.0.1', 'mock-url']] } });

    const result = await checkFirmware({ model: 'ado1', version: '1.0.0' } as IDeviceInfo);

    expect(result).toEqual({
      changelog_en: 'AdorFirmware 1.0.1',
      changelog_zh: 'AdorFirmware 1.0.1',
      downloadUrl: 'mock-url',
      latestVersion: '1.0.1',
      needUpdate: true,
    });
    expect(mockGet).toHaveBeenCalledWith('api/check-update?key=ador-latest');
  });

  test('check fbm2 firmware', async () => {
    mockGet.mockResolvedValueOnce({ data: { links: [['NXFirmware 1.0.1', 'mock-url']] } });

    const result = await checkFirmware({ model: 'fbm2', version: '1.0.0' } as IDeviceInfo);

    expect(result).toEqual({
      changelog_en: 'NXFirmware 1.0.1',
      changelog_zh: 'NXFirmware 1.0.1',
      downloadUrl: 'mock-url',
      latestVersion: '1.0.1',
      needUpdate: true,
    });
    expect(mockGet).toHaveBeenCalledWith('api/check-update?key=nx-latest');
  });

  test('check with error', async () => {
    const errorSpy = jest.spyOn(console, 'error');

    mockGet.mockRejectedValueOnce(new Error('Network Error'));

    const result = await checkFirmware({ model: 'fbm1', version: '1.0.0' } as IDeviceInfo);

    expect(result).toEqual({
      needUpdate: false,
    });

    expect(mockGet).toHaveBeenCalledWith('api/check-update?key=firmware-latest');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
