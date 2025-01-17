import { IDeviceInfo } from 'interfaces/IDevice';
import getAutoFocusPosition from './getAutoFocusPosition';

jest.mock('app/constants/device-constants', () => ({
  WORKAREA_IN_MM: {
    'model-1': [430, 300],
    'model-2': [500, 500],
  },
}));

const mockRawGetLastPos = jest.fn();
jest.mock('helpers/device-master', () => ({
  rawGetLastPos: (...args) => mockRawGetLastPos(...args),
}));

const mockDevice = { model: 'model-1' };
describe('test getAutoFocusPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work', async () => {
    mockRawGetLastPos.mockResolvedValue({ x: 75, y: 50 });
    let res = await getAutoFocusPosition(mockDevice as IDeviceInfo);
    expect(res).toBe('A');

    mockRawGetLastPos.mockResolvedValue({ x: 215, y: 250 });
    res = await getAutoFocusPosition(mockDevice as IDeviceInfo);
    expect(res).toBe('H');

    mockRawGetLastPos.mockResolvedValue({ x: 365, y: 150 });
    res = await getAutoFocusPosition(mockDevice as IDeviceInfo);
    expect(res).toBe('F');
  });
});
