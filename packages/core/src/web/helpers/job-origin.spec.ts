import getJobOrigin, { getRefModule } from './job-origin';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockGetAllLayers = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getAllLayers: (...args) => mockGetAllLayers(...args),
}));

const mockGetData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
}));

const mockWorkareaWidth = jest.fn();
const mockWorkareaHeight = jest.fn();
const mockWorkareaExpansion = jest.fn();
jest.mock('app/svgedit/workarea', () => ({
  get width() {
    return mockWorkareaWidth();
  },
  get height() {
    return mockWorkareaHeight();
  },
  get expansion() {
    return mockWorkareaExpansion();
  },
}));

describe('test job-origin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRefModule', () => {
    const mockLayer1 = { getAttribute: () => 'none' };
    const mockLayer2 = { getAttribute: () => 'block' };
    mockGetAllLayers.mockReturnValue([mockLayer1, mockLayer2]);
    mockGetData.mockReturnValue(1);
    expect(getRefModule()).toBe(1);
    expect(mockGetAllLayers).toBeCalledTimes(1);
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetData).toBeCalledWith(mockLayer2, 'module');
  });

  describe('getJobOrigin', () => {
    beforeEach(() => {
      mockWorkareaWidth.mockReturnValue(100);
      mockWorkareaHeight.mockReturnValue(200);
      mockWorkareaExpansion.mockReturnValue([0, 0]);
      const mockElem = {
        getBBox: () => ({ x: 10, y: 20, width: 30, height: 40 }),
      };
      document.getElementById = jest.fn().mockReturnValue(mockElem);
    });

    const testCases = [
      { jobOrigin: 1, px: false, res: { x: 1, y: 2 } },
      { jobOrigin: 2, px: true, res: { x: 25, y: 20 } },
      { jobOrigin: 3, px: false, res: { x: 4, y: 2 } },
      { jobOrigin: 4, px: true, res: { x: 10, y: 40 } },
      { jobOrigin: 5, px: false, res: { x: 2.5, y: 4 } },
      { jobOrigin: 6, px: true, res: { x: 40, y: 40 } },
      { jobOrigin: 7, px: false, res: { x: 1, y: 6 } },
      { jobOrigin: 8, px: true, res: { x: 25, y: 60 } },
      { jobOrigin: 9, px: false, res: { x: 4, y: 6 } },
    ];
    testCases.forEach(({ jobOrigin, px, res }) => {
      test(`getJobOrigin with value ${jobOrigin}`, () => {
        mockRead.mockReturnValue(jobOrigin);
        expect(getJobOrigin(px)).toEqual(res);
        expect(document.getElementById).toBeCalledTimes(1);
        expect(mockWorkareaWidth).toBeCalledTimes(1);
        expect(mockWorkareaHeight).toBeCalledTimes(1);
        expect(mockWorkareaExpansion).toBeCalledTimes(1);
      });
    });
  });
});
