import getPerspectiveForAlign from './getPerspectiveForAlign';

const mockFetchAutoLevelingData = jest.fn();
const mockEnterRawMode = jest.fn();
const mockRawGetProbePos = jest.fn();
const mockEndRawMode = jest.fn();
jest.mock('helpers/device-master', () => ({
  fetchAutoLevelingData: (...args) => mockFetchAutoLevelingData(...args),
  enterRawMode: (...args) => mockEnterRawMode(...args),
  rawGetProbePos: (...args) => mockRawGetProbePos(...args),
  endRawMode: (...args) => mockEndRawMode(...args),
}));

const mockGetPerspectivePointsZ3Regression = jest.fn();
const mockInterpolatePointsFromHeight = jest.fn();
jest.mock('helpers/camera-calibration-helper', () => ({
  getPerspectivePointsZ3Regression: (...args) => mockGetPerspectivePointsZ3Regression(...args),
  interpolatePointsFromHeight: (...args) => mockInterpolatePointsFromHeight(...args),
}));

const mockGetWorkarea = jest.fn();
jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

describe('test getPerspectiveForAlign', () => {
  beforeEach(() => {
    mockFetchAutoLevelingData
      .mockResolvedValueOnce({
        A: 1,
        B: 2,
        C: 3,
        D: 4,
        E: 5,
        F: 6,
        G: 7,
        H: 8,
        I: 9,
      })
      .mockResolvedValueOnce({
        A: -1,
        B: -2,
        C: -3,
        D: -4,
        E: -5,
        F: -6,
        G: -7,
        H: -8,
        I: -9,
      })
      .mockResolvedValueOnce({
        A: 2,
        B: 4,
        C: 6,
        D: 8,
        E: 10,
        F: 12,
        G: 14,
        H: 16,
        I: 18,
      });
    mockEnterRawMode.mockResolvedValueOnce(null);
    mockRawGetProbePos.mockResolvedValueOnce({ z: 1, didAf: true });
    mockEndRawMode.mockResolvedValueOnce(null);
  });

  it('should return correct perspective when using z3regParam', async () => {
    mockGetWorkarea.mockReturnValue({ width: 100, height: 100, deep: 2 });
    mockGetPerspectivePointsZ3Regression.mockReturnValueOnce('mock-perspective');
    const res = await getPerspectiveForAlign(
      { model: 'ado1' } as any,
      { heights: 'mock-heights', z3regParam: 'mock-z3-reg-param' } as any,
      'mock-center' as any
    );
    expect(mockGetWorkarea).toBeCalledTimes(2);
    expect(mockGetWorkarea).toHaveBeenNthCalledWith(1, 'ado1', 'ado1');
    expect(mockGetWorkarea).toHaveBeenNthCalledWith(2, 'ado1', 'ado1');
    expect(mockFetchAutoLevelingData).toBeCalledTimes(3);
    expect(mockFetchAutoLevelingData).toHaveBeenNthCalledWith(1, 'hexa_platform');
    expect(mockFetchAutoLevelingData).toHaveBeenNthCalledWith(2, 'bottom_cover');
    expect(mockFetchAutoLevelingData).toHaveBeenNthCalledWith(3, 'offset');
    expect(mockInterpolatePointsFromHeight).not.toBeCalled();
    expect(mockGetPerspectivePointsZ3Regression).toBeCalledTimes(1);
    expect(mockGetPerspectivePointsZ3Regression).toHaveBeenLastCalledWith(1, 'mock-z3-reg-param', {
      chessboard: [48, 36],
      workarea: [100, 100],
      center: 'mock-center',
      levelingOffsets: {
        A: -6,
        B: -2,
        C: 2,
        D: 6,
        E: 10,
        F: 14,
        G: 18,
        H: 22,
        I: 26,
      },
    });
    expect(res).toEqual('mock-perspective');
  });
});
