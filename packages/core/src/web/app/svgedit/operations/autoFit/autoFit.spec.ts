const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();
const mockGetCameraCanvasUrl = jest.fn();
const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
const mockShowAutoFitPanel = jest.fn();
const mockGetAllSimilarContours = jest.fn();
const mockGetUtilWS = jest.fn();

let mockIsFullWorkareaDrawn = true;

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  getCameraCanvasUrl: (...args: any[]) => mockGetCameraCanvasUrl(...args),
  get isFullWorkareaDrawn() {
    return mockIsFullWorkareaDrawn;
  },
}));

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any[]) => mockOpenNonstopProgress(...args),
  popById: (...args: any[]) => mockPopById(...args),
}));

jest.mock('@core/app/components/dialogs/autoFit', () => ({
  showAutoFitPanel: (...args: any[]) => mockShowAutoFitPanel(...args),
}));

jest.mock('@core/helpers/api/utils-ws', () => ({
  __esModule: true,
  default: (...args: any[]) => mockGetUtilWS(...args),
}));

import i18n from '@core/helpers/i18n';

import { dataCache, setDataCache } from './dataCache';

import autoFit from './autoFit';

const elem = { id: 'elem' } as unknown as SVGElement;
const url = 'blob:preview-url';

const makeContour = (): any => [{ angle: 0, bbox: [0, 0, 1, 1], center: [0, 0], contour: [[0, 0]] }];

describe('autoFit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFullWorkareaDrawn = true;
    setDataCache({ url: '' });
    mockGetCameraCanvasUrl.mockResolvedValue(url);
    mockGetUtilWS.mockReturnValue({ getAllSimilarContours: mockGetAllSimilarContours });
    (global as any).fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue('blob-data') });
  });

  test('alerts to preview first when no camera background url', async () => {
    mockGetCameraCanvasUrl.mockResolvedValueOnce('');

    await autoFit(elem);

    expect(mockPopUp).toHaveBeenCalledWith({ message: i18n.lang.auto_fit.preview_first });
    expect(mockOpenNonstopProgress).not.toHaveBeenCalled();
    expect(mockShowAutoFitPanel).not.toHaveBeenCalled();
  });

  test('fetches contours and shows panel on success', async () => {
    const data = [makeContour(), makeContour()];

    mockGetAllSimilarContours.mockResolvedValueOnce(data);

    await autoFit(elem);

    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'auto-fit', message: expect.any(String) });
    expect(mockGetAllSimilarContours).toHaveBeenCalledWith('blob-data', { isSplicingImg: false });
    expect(mockShowAutoFitPanel).toHaveBeenCalledWith(elem, url, data, false);
    // progress is always closed in finally
    expect(mockPopById).toHaveBeenCalledWith('auto-fit');
  });

  test('passes isSplicingImg=true when workarea is not fully drawn', async () => {
    mockIsFullWorkareaDrawn = false;
    mockGetAllSimilarContours.mockResolvedValueOnce([makeContour()]);

    await autoFit(elem);

    expect(mockGetAllSimilarContours).toHaveBeenCalledWith('blob-data', { isSplicingImg: true });
    expect(mockShowAutoFitPanel).toHaveBeenCalledWith(elem, url, [makeContour()], true);
  });

  test('caches contour data and reuses it on subsequent calls with same url', async () => {
    const data = [makeContour()];

    mockGetAllSimilarContours.mockResolvedValueOnce(data);

    await autoFit(elem);

    expect(dataCache.url).toBe(url);
    expect(dataCache.data).toBe(data);
    expect(mockGetAllSimilarContours).toHaveBeenCalledTimes(1);

    // second call should hit cache, not re-fetch contours
    await autoFit(elem);

    expect(mockGetAllSimilarContours).toHaveBeenCalledTimes(1);
    expect(mockShowAutoFitPanel).toHaveBeenCalledTimes(2);
    expect(mockShowAutoFitPanel).toHaveBeenLastCalledWith(elem, url, data, false);
  });

  test('re-fetches when url changes', async () => {
    setDataCache({ data: [makeContour()], url: 'blob:stale-url' });
    mockGetAllSimilarContours.mockResolvedValueOnce([makeContour()]);

    await autoFit(elem);

    expect(mockGetAllSimilarContours).toHaveBeenCalledTimes(1);
    expect(dataCache.url).toBe(url);
  });

  test('alerts when no contours found and does not show panel', async () => {
    mockGetAllSimilarContours.mockResolvedValueOnce([]);

    await autoFit(elem);

    expect(mockPopUp).toHaveBeenCalledWith({ message: i18n.lang.auto_fit.failed_to_find_contour });
    expect(mockShowAutoFitPanel).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledWith('auto-fit');
  });

  test('pops up error and still closes progress when fetch throws', async () => {
    const error = new Error('boom');

    (global as any).fetch = jest.fn().mockRejectedValueOnce(error);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await autoFit(elem);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: expect.stringContaining('Failed to auto fit') });
    expect(mockShowAutoFitPanel).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledWith('auto-fit');
  });

  test('opens and closes progress as a pair on the happy path', async () => {
    mockGetAllSimilarContours.mockResolvedValueOnce([makeContour()]);

    await autoFit(elem);

    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledTimes(1);
  });
});
