import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockGetDeviceSetting = jest.fn();
const mockSetDeviceSetting = jest.fn();
const mockCurrentDevice: undefined | { info: { uuid: string } } = { info: { uuid: 'uuid-1' } };

jest.mock('../device-master', () => ({
  get currentDevice() {
    return mockCurrentDevice;
  },
  getDeviceSetting: (...args: unknown[]) => mockGetDeviceSetting(...args),
  setDeviceSetting: (...args: unknown[]) => mockSetDeviceSetting(...args),
}));

import { defaultGalvoConfig, getGalvoConfig, isGalvoModule, updateGalvoConfig } from './galvoConfig';

describe('test galvoConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentDevice.info.uuid = `uuid-${Math.random()}`;
  });

  it('should recognise the galvo modules', () => {
    expect(isGalvoModule(LayerModule.GALVO_CO2)).toBe(true);
    expect(isGalvoModule(LayerModule.GALVO_MOPA)).toBe(true);
    expect(isGalvoModule(LayerModule.LASER_UNIVERSAL)).toBe(false);
  });

  it('should read each module from its own config key', async () => {
    mockGetDeviceSetting.mockResolvedValue({ status: 'ok', value: JSON.stringify({ workarea: 70 }) });

    await getGalvoConfig(LayerModule.GALVO_CO2);
    expect(mockGetDeviceSetting).toHaveBeenLastCalledWith('galvo_co2');

    await getGalvoConfig(LayerModule.GALVO_MOPA);
    expect(mockGetDeviceSetting).toHaveBeenLastCalledWith('galvo_mopa');
  });

  it('should fill in defaults for keys the machine omits', async () => {
    mockGetDeviceSetting.mockResolvedValue({ status: 'ok', value: JSON.stringify({ workarea: 70 }) });

    const config = await getGalvoConfig(LayerModule.GALVO_CO2);

    expect(config.workarea).toBe(70);
    expect(config.field).toEqual(defaultGalvoConfig.field);
  });

  it('should fall back to defaults when the read fails', async () => {
    mockGetDeviceSetting.mockRejectedValue(new Error('offline'));

    await expect(getGalvoConfig(LayerModule.GALVO_CO2)).resolves.toEqual(defaultGalvoConfig);
  });

  it('should send only the keys being changed, escaped', async () => {
    mockSetDeviceSetting.mockResolvedValue({ status: 'ok' });

    await updateGalvoConfig(LayerModule.GALVO_MOPA, { workarea: 70 });

    expect(mockSetDeviceSetting).toHaveBeenLastCalledWith('galvo_mopa', '{\\\\\\"workarea\\\\\\":70}');
  });

  it('should serve a written value from cache without asking the machine again', async () => {
    mockSetDeviceSetting.mockResolvedValue({ status: 'ok' });
    mockGetDeviceSetting.mockResolvedValue({ status: 'ok', value: JSON.stringify(defaultGalvoConfig) });

    await getGalvoConfig(LayerModule.GALVO_CO2);
    await updateGalvoConfig(LayerModule.GALVO_CO2, { focusHeight: 8 });
    mockGetDeviceSetting.mockClear();

    const config = await getGalvoConfig(LayerModule.GALVO_CO2);

    expect(config.focusHeight).toBe(8);
    expect(mockGetDeviceSetting).not.toHaveBeenCalled();
  });

  it('should re-read the machine when the cache is bypassed', async () => {
    mockGetDeviceSetting.mockResolvedValue({ status: 'ok', value: JSON.stringify({ focusHeight: 3 }) });

    await getGalvoConfig(LayerModule.GALVO_CO2);
    await getGalvoConfig(LayerModule.GALVO_CO2, { useCache: false });

    expect(mockGetDeviceSetting).toHaveBeenCalledTimes(2);
  });
});
