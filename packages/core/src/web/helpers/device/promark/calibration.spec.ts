const mockLoadSVG = jest.fn();
const mockConvert = jest.fn();

jest.mock('@core/helpers/api/swiftray-client', () => ({
  swiftrayClient: {
    convert: (...args) => mockConvert(...args),
    loadSVG: (...args) => mockLoadSVG(...args),
  },
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({ getDefaultConfig: () => ({}) }));
jest.mock('./promark-info', () => ({ getPromarkInfo: () => ({ laserType: 0, watt: 20 }) }));

import { loadTaskToSwiftray } from './calibration';

describe('test loadTaskToSwiftray', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSVG.mockResolvedValue({ success: true });
    mockConvert.mockResolvedValue({ success: true });
  });

  test('converts for the given field size rather than the document size', async () => {
    await loadTaskToSwiftray('<svg />', 'fpm1', 200);

    expect(mockLoadSVG).toHaveBeenCalledWith(expect.objectContaining({ data: '<svg />' }), expect.anything(), {
      model: 'fpm1',
      rotaryMode: false,
    });
    expect(mockConvert).toHaveBeenCalledWith('gcode', expect.anything(), {
      isPromark: true,
      model: 'fpm1',
      travelSpeed: 4000,
      workarea: { height: 200, width: 200 },
    });
  });

  test('without a size, leaves the work area to the document', async () => {
    await loadTaskToSwiftray('<svg />', 'fpm1');

    expect(mockConvert).toHaveBeenCalledWith('gcode', expect.anything(), {
      isPromark: true,
      model: 'fpm1',
      travelSpeed: 4000,
    });
  });

  test('throws when loading or converting fails', async () => {
    mockConvert.mockResolvedValueOnce({ error: { message: 'bad' }, success: false });
    await expect(loadTaskToSwiftray('<svg />', 'fpm1', 70)).rejects.toThrow('Failed to convert calibration task: bad');
    mockLoadSVG.mockResolvedValueOnce({ success: false });
    await expect(loadTaskToSwiftray('<svg />', 'fpm1', 70)).rejects.toThrow('Failed to load calibration task');
  });
});
