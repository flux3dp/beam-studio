const mockUpdateData = jest.fn();
const mockAutoPnPDetect = jest.fn();
const mockAutoPnPMatch = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: {
    autoPnPDetect: (...args: any[]) => mockAutoPnPDetect(...args),
    autoPnPMatch: (...args: any[]) => mockAutoPnPMatch(...args),
    updateData: (...args: any[]) => mockUpdateData(...args),
  },
}));

const mockGetExposureSettings = jest.fn();
const mockSetExposure = jest.fn();

jest.mock('@core/helpers/device/camera/cameraExposure', () => ({
  getExposureSettings: (...args: any[]) => mockGetExposureSettings(...args),
  setExposure: (...args: any[]) => mockSetExposure(...args),
}));

const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockGetCameraExposureAuto = jest.fn();
const mockSetCameraExposureAuto = jest.fn();
const mockSetCamera = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args: any[]) => mockConnectCamera(...args),
  disconnectCamera: (...args: any[]) => mockDisconnectCamera(...args),
  getCameraExposureAuto: (...args: any[]) => mockGetCameraExposureAuto(...args),
  setCamera: (...args: any[]) => mockSetCamera(...args),
  setCameraExposureAuto: (...args: any[]) => mockSetCameraExposureAuto(...args),
  takeOnePicture: (...args: any[]) => mockTakeOnePicture(...args),
}));

import autoLocateMarks from './autoLocateMarks';

const EXPOSURE_ROUNDS = [
  [75, 200],
  [50, 125, 350],
];

const params = { d: [[0]], k: [[1]] } as any;
const refPoints = Array.from({ length: 8 }, (_, i) => [i * 10, i * 5] as [number, number]);
const points = Array.from({ length: 8 }, (_, i) => [i, i * 10] as [number, number]);
const run = (options = {}) => autoLocateMarks({ exposureRounds: EXPOSURE_ROUNDS, params, refPoints, ...options });
const firstRound = [...EXPOSURE_ROUNDS[0]];
const allExposures = EXPOSURE_ROUNDS.flat();

/** every setExposure / setCameraExposureAuto call in the order it happened */
let cameraCalls: Array<[string, boolean | number]>;

describe('autoLocateMarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    cameraCalls = [];
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 320 });
    mockSetExposure.mockImplementation(async (value: number) => {
      cameraCalls.push(['exposure', value]);

      return true;
    });
    mockGetCameraExposureAuto.mockResolvedValue({ data: false, success: true });
    mockSetCameraExposureAuto.mockImplementation(async (on: boolean) => {
      cameraCalls.push(['auto', on]);

      return true;
    });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob(['photo']) });
    mockAutoPnPDetect.mockResolvedValue({ blobs: [[1, 2, 3, 4]], success: true, weak: [[5, 6, 7, 8]] });
    mockAutoPnPMatch.mockResolvedValue({ filled: 0, matched: 8, points, rms: 0.4, success: true });
    mockSetCamera.mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  test('returns the matched points from the first round and restores the exposure', async () => {
    const res = await run();

    expect(mockUpdateData).toHaveBeenCalledWith(params);
    expect(mockSetCamera).not.toHaveBeenCalled();
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(firstRound.length * 2);
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(1);

    const [sentRefPoints, blobs, weak, rMax] = mockAutoPnPMatch.mock.calls[0];

    expect(sentRefPoints).toBe(refPoints);
    expect(blobs).toHaveLength(firstRound.length);
    expect(weak).toHaveLength(firstRound.length);
    expect(rMax).toBeUndefined();
    expect(res).toEqual({ highResidual: false, points, rms: 0.4, success: true });
    expect(cameraCalls).toEqual([...firstRound.map((e) => ['exposure', e]), ['exposure', 320]]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('passes the residual limit and selects the camera when asked', async () => {
    await run({ cameraIndex: 0, rMax: 0.2 });

    expect(mockSetCamera).toHaveBeenCalledWith(0);
    expect(mockAutoPnPMatch.mock.calls[0][3]).toBe(0.2);

    mockSetCamera.mockResolvedValue(false);
    expect(await run({ cameraIndex: 0 })).toEqual({ reason: 'NO_IMAGE', success: false });
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(2);
  });

  test('takes one photo and leaves the exposure alone without exposure rounds', async () => {
    const res = await run({ exposureRounds: undefined });

    expect(res.success).toBe(true);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockGetExposureSettings).not.toHaveBeenCalled();
    expect(mockGetCameraExposureAuto).not.toHaveBeenCalled();
    expect(cameraCalls).toEqual([]);
  });

  test('takes one photo and leaves the exposure alone when the machine cannot report its exposure', async () => {
    mockGetExposureSettings.mockRejectedValue(new SyntaxError('"undefined" is not valid JSON'));

    const res = await run();

    expect(res.success).toBe(true);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockGetCameraExposureAuto).not.toHaveBeenCalled();
    expect(cameraCalls).toEqual([]);
  });

  test('shoots the second round only when marks are missing', async () => {
    mockAutoPnPMatch.mockResolvedValueOnce({ matched: 6, reason: 'NOT_ENOUGH_MARKS', success: false });

    const res = await run();

    expect(res.success).toBe(true);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(allExposures.length * 2);
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(2);
    // the second match gets every photo so far, not just the new ones
    expect(mockAutoPnPMatch.mock.calls[1][1]).toHaveLength(allExposures.length);
    expect(cameraCalls).toEqual([...allExposures.map((e) => ['exposure', e]), ['exposure', 320]]);
  });

  test('hands the found marks back with the predicted ones in the gaps when marks are missing', async () => {
    mockAutoPnPMatch.mockResolvedValue({
      matched: 6,
      points: [...points.slice(0, 6), null, null],
      predicted: points.map(([x, y]) => [x + 100, y + 100]),
      reason: 'NOT_ENOUGH_MARKS',
      rms: 0.3,
      success: false,
    });

    const res = await run();

    expect(res).toMatchObject({ matched: 6, reason: 'NOT_ENOUGH_MARKS', success: false });
    expect((res as any).initialPoints).toEqual([...points.slice(0, 6), [106, 160], [107, 170]]);
  });

  test('hands back no starting points when the backend predicts none', async () => {
    mockAutoPnPMatch.mockResolvedValue({
      matched: 2,
      points: [points[0], points[1], null, null, null, null, null, null],
      predicted: null,
      reason: 'NOT_ENOUGH_MARKS',
      rms: null,
      success: false,
    });

    expect(await run()).toEqual({ matched: 2, reason: 'NOT_ENOUGH_MARKS', rms: null, success: false });
  });

  test('reports missing marks after both rounds', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 6, reason: 'NOT_ENOUGH_MARKS', rms: 0.3, success: false });

    const res = await run();

    expect(res).toEqual({ matched: 6, reason: 'NOT_ENOUGH_MARKS', rms: 0.3, success: false });
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(2);
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test('keeps the points of a high residual, without more photos, and flags it for the caller', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 8, points, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });

    expect(await run()).toEqual({ highResidual: true, points, rms: 1.8, success: true });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(firstRound.length * 2);
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test('reports a high residual that comes without usable points', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 8, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });
    expect(await run()).toEqual({ matched: 8, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });

    mockAutoPnPMatch.mockResolvedValue({ points: [null, ...points.slice(1)], reason: 'HIGH_RESIDUAL', success: false });
    expect((await run()).success).toBe(false);
  });

  test('detects on the second photo after an exposure change: the first still has the old exposure', async () => {
    const stale = new Blob(['stale']);
    const fresh = new Blob(['fresh']);

    mockTakeOnePicture.mockResolvedValueOnce({ imgBlob: stale }).mockResolvedValueOnce({ imgBlob: fresh });
    await run({ exposureRounds: [[250]] });

    expect(mockAutoPnPDetect).toHaveBeenCalledTimes(1);
    expect(mockAutoPnPDetect).toHaveBeenCalledWith(fresh);
  });

  test('sends no match once cancelled during the last photo of a round', async () => {
    const res = await run({ isCancelled: () => mockAutoPnPDetect.mock.calls.length === firstRound.length });

    expect(res).toEqual({ reason: 'CANCELLED', success: false });
    expect(mockAutoPnPMatch).not.toHaveBeenCalled();
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test('hands back no points once cancelled during the match', async () => {
    const res = await run({ isCancelled: () => mockAutoPnPMatch.mock.calls.length > 0 });

    expect(res).toEqual({ reason: 'CANCELLED', success: false });
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(1);
  });

  test('takes no further photo once cancelled during the dropped one, and still restores the exposure', async () => {
    const res = await run({ isCancelled: () => mockTakeOnePicture.mock.calls.length > 0 });

    expect(res).toEqual({ reason: 'CANCELLED', success: false });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockAutoPnPDetect).not.toHaveBeenCalled();
    expect(mockAutoPnPMatch).not.toHaveBeenCalled();
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('hands back no points once cancelled while the exposure is restored', async () => {
    const res = await run({ isCancelled: () => cameraCalls.at(-1)?.[1] === 320 });

    expect(res).toEqual({ reason: 'CANCELLED', success: false });
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(1);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('stops at the first photo when the backend does not know the command', async () => {
    mockAutoPnPDetect.mockResolvedValue({ reason: 'UNSUPPORTED', success: false });

    const res = await run();

    expect(res).toEqual({ reason: 'UNSUPPORTED', success: false });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(2);
    expect(mockAutoPnPMatch).not.toHaveBeenCalled();
    expect(cameraCalls).toEqual([
      ['exposure', firstRound[0]],
      ['exposure', 320],
    ]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('reports a missing photo', async () => {
    mockTakeOnePicture.mockResolvedValue(null);

    expect(await run()).toEqual({ reason: 'NO_IMAGE', success: false });
    expect(mockAutoPnPDetect).not.toHaveBeenCalled();
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('disconnects when the camera connection fails', async () => {
    mockConnectCamera.mockRejectedValueOnce(new Error('timeout'));

    await expect(run()).rejects.toThrow('timeout');
    expect(cameraCalls).toEqual([]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['is refused', () => mockSetExposure.mockResolvedValueOnce(false)],
    ['throws', () => mockSetExposure.mockRejectedValueOnce(new Error('timeout'))],
  ])('matches one photo as it is when setting the exposure %s, and shoots no more', async (_, setup) => {
    setup();
    mockAutoPnPMatch.mockResolvedValue({ matched: 6, reason: 'NOT_ENOUGH_MARKS', rms: null, success: false });

    expect(await run()).toEqual({ matched: 6, reason: 'NOT_ENOUGH_MARKS', rms: null, success: false });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(1);
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test.each([
    ['is refused', () => mockSetCameraExposureAuto.mockResolvedValueOnce(false)],
    ['throws', () => mockSetCameraExposureAuto.mockRejectedValueOnce(new Error('timeout'))],
  ])('takes one photo and leaves the exposure alone when turning auto exposure off %s', async (_, setup) => {
    mockGetCameraExposureAuto.mockResolvedValue({ data: true, success: true });
    setup();

    expect(await run()).toEqual({ highResidual: false, points, rms: 0.4, success: true });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(cameraCalls).toEqual([]);
  });

  test('restores the exposure and disconnects when a call throws', async () => {
    mockAutoPnPDetect.mockRejectedValue(new Error('socket closed'));

    await expect(run()).rejects.toThrow('socket closed');
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('turns auto exposure off before the first photo and back on after the exposure is restored', async () => {
    mockGetCameraExposureAuto.mockResolvedValue({ data: true, success: true });

    await run();

    expect(cameraCalls).toEqual([
      ['auto', false],
      ...firstRound.map((e) => ['exposure', e]),
      ['exposure', 320],
      ['auto', true],
    ]);
  });

  test('leaves auto exposure alone when it is off or cannot be read', async () => {
    await run();
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    mockGetCameraExposureAuto.mockResolvedValue({ data: 'unknown command', success: false });
    await run();
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    mockGetCameraExposureAuto.mockRejectedValue(new Error('timeout'));
    expect((await run()).success).toBe(true);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    // camera not connected: device-master returns null instead of a promise
    mockGetCameraExposureAuto.mockReturnValue(null);
    expect((await run()).success).toBe(true);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();
  });
});
