import getJobOrigin, { getRefModule } from './job-origin';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetAllLayers = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getAllLayers: (...args) => mockGetAllLayers(...args),
}));

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
}));

const mockWorkareaWidth = jest.fn();
const mockWorkareaMaxY = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get maxY() {
    return mockWorkareaMaxY();
  },
  get width() {
    return mockWorkareaWidth();
  },
}));

const mockGetSvgContentActualBBox = jest.fn();

jest.mock('./file/export/utils/getBBox', () => ({
  getSvgContentActualBBox: (...args) => mockGetSvgContentActualBBox(...args),
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
    expect(mockGetAllLayers).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledWith(mockLayer2, 'module');
  });

  describe('getJobOrigin', () => {
    beforeEach(() => {
      mockWorkareaWidth.mockReturnValue(100);
      mockWorkareaMaxY.mockReturnValue(200);

      mockGetSvgContentActualBBox.mockResolvedValue({ height: 40, width: 30, x: 10, y: 20 });
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
      test(`getJobOrigin with value ${jobOrigin}`, async () => {
        mockGetState.mockReturnValue({ 'job-origin': jobOrigin });
        expect(await getJobOrigin(px)).toEqual(res);
        expect(mockWorkareaWidth).toHaveBeenCalledTimes(1);
        expect(mockWorkareaMaxY).toHaveBeenCalledTimes(1);
      });
    });
  });
});
