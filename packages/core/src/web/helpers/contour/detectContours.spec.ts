const mockDetectContours = jest.fn();
const mockGetContours = jest.fn();
let mockHasSwiftray = true;
let mockIsWeb = false;
let mockVersion = '1.4.11';
let mockReadyState = WebSocket.OPEN;

jest.mock('@core/helpers/api/swiftray-client', () => ({
  get hasSwiftray() {
    return mockHasSwiftray;
  },
  swiftrayClient: {
    detectContours: (...args: any[]) => mockDetectContours(...args),
    get readyState() {
      return mockReadyState;
    },
    get version() {
      return mockVersion;
    },
  },
}));
jest.mock('@core/helpers/api/utils-ws', () => () => ({ getContours: (...args: any[]) => mockGetContours(...args) }));
jest.mock('@core/helpers/is-web', () => () => mockIsWeb);

import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

import { detectContours, getEffectiveContourEngine } from './detectContours';

const blob = new Blob(['img'], { type: 'image/png' });
const swiftrayObject = {
  angle: 0.5,
  area: 100,
  bbox: [10, 20, 30, 40],
  center: [25, 40],
  id: 1,
  polygon: [
    [10, 20],
    [40, 60],
  ],
  score: 0.9,
};

const mockBitmap = (width: number, height: number) => {
  (global as any).createImageBitmap = jest.fn().mockResolvedValue({ close: jest.fn(), height, width });
};

// the globalPreferenceStore mock keeps state across tests; reset the key each time
const resetEnv = () => {
  mockHasSwiftray = true;
  mockIsWeb = false;
  mockVersion = '1.4.11';
  mockReadyState = WebSocket.OPEN;
  useGlobalPreferenceStore.getState().set('contour-engine', 'onnx');
};

describe('getEffectiveContourEngine', () => {
  beforeEach(resetEnv);

  test('returns the preference when Swiftray can host the model', () => {
    expect(getEffectiveContourEngine()).toBe('onnx');
    useGlobalPreferenceStore.getState().set('contour-engine', 'opencv');
    expect(getEffectiveContourEngine()).toBe('opencv');
  });

  test.each([
    ['web', () => (mockIsWeb = true)],
    ['no Swiftray', () => (mockHasSwiftray = false)],
    ['old Swiftray', () => (mockVersion = '1.4.10')],
    ['disconnected Swiftray', () => (mockReadyState = WebSocket.CLOSED)],
  ])('downgrades to opencv on %s', (_, setup) => {
    setup();
    expect(getEffectiveContourEngine()).toBe('opencv');
  });
});

describe('detectContours', () => {
  let drawImage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    resetEnv();
    drawImage = jest.fn();
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as any);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb) {
      cb(new Blob([`scaled-${this.width}x${this.height}`]));
    });
    mockDetectContours.mockResolvedValue({ height: 853, objects: [swiftrayObject], timeMs: 1, width: 1280 });
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('downscales large images to 1280 px and maps results back', async () => {
    mockBitmap(3000, 2000);

    const res = await detectContours(blob);
    const k = 3000 / 1280;

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1280, 853);
    expect(mockDetectContours.mock.calls[0][0]).not.toBe(blob); // the scaled copy is sent
    expect(res).toEqual([
      {
        angle: 0.5,
        bbox: [10 * k, 20 * k, 30 * k, 40 * k],
        center: [25 * k, 40 * k],
        contour: [
          [10 * k, 20 * k],
          [40 * k, 60 * k],
        ],
      },
    ]);
  });

  test('sends small images untouched', async () => {
    mockBitmap(1000, 600);

    const res = await detectContours(blob);

    expect(drawImage).not.toHaveBeenCalled();
    expect(mockDetectContours).toHaveBeenCalledWith(blob);
    expect(res[0].bbox).toEqual([10, 20, 30, 40]);
  });

  test('falls back to opencv for the call when onnx fails', async () => {
    mockBitmap(1000, 600);
    mockDetectContours.mockRejectedValueOnce(new Error('swiftray down'));
    mockGetContours.mockResolvedValueOnce(['opencv-result']);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await detectContours(blob, { isSplicingImg: true });

    expect(mockGetContours).toHaveBeenCalledWith(blob, { isSplicingImg: true });
    expect(res).toEqual(['opencv-result']);
    expect(getEffectiveContourEngine()).toBe('onnx'); // preference untouched
  });

  test('uses opencv directly when that is the effective engine', async () => {
    useGlobalPreferenceStore.getState().set('contour-engine', 'opencv');
    mockGetContours.mockResolvedValueOnce([]);

    await detectContours(blob);

    expect(mockDetectContours).not.toHaveBeenCalled();
    expect(mockGetContours).toHaveBeenCalledWith(blob, { isSplicingImg: undefined });
  });
});
