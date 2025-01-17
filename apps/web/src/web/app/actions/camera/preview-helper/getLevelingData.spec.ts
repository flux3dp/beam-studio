import getLevelingData from './getLevelingData';

const mockFetchAutoLevelingData = jest.fn();
jest.mock('helpers/device-master', () => ({
  fetchAutoLevelingData: (...args) => mockFetchAutoLevelingData(...args),
}));

describe('test getLevelingData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return leveling data from device', async () => {
    mockFetchAutoLevelingData.mockResolvedValue({ A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9 });
    const res = await getLevelingData('bottom_cover');
    expect(res).toStrictEqual({ A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9 });
    expect(mockFetchAutoLevelingData).toHaveBeenCalledTimes(1);
    expect(mockFetchAutoLevelingData).toHaveBeenLastCalledWith('bottom_cover');
  });

  it('should return default leveling data when error occurs', async () => {
    mockFetchAutoLevelingData.mockRejectedValue(new Error('mock error'));
    const res = await getLevelingData('hexa_platform');
    expect(res).toStrictEqual({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 });
    expect(mockFetchAutoLevelingData).toHaveBeenCalledTimes(1);
    expect(mockFetchAutoLevelingData).toHaveBeenLastCalledWith('hexa_platform');
  });
});
