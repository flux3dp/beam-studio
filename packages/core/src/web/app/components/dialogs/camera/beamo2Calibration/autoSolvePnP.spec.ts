import { bm2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';

const mockUpdateData = jest.fn();
const mockAutoPnPDetect = jest.fn();
const mockAutoPnPMatch = jest.fn();
const mockSolvePnPCalculate = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: {
    autoPnPDetect: (...args: any[]) => mockAutoPnPDetect(...args),
    autoPnPMatch: (...args: any[]) => mockAutoPnPMatch(...args),
    solvePnPCalculate: (...args: any[]) => mockSolvePnPCalculate(...args),
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

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args: any[]) => mockConnectCamera(...args),
  disconnectCamera: (...args: any[]) => mockDisconnectCamera(...args),
  getCameraExposureAuto: (...args: any[]) => mockGetCameraExposureAuto(...args),
  setCameraExposureAuto: (...args: any[]) => mockSetCameraExposureAuto(...args),
  takeOnePicture: (...args: any[]) => mockTakeOnePicture(...args),
}));

import autoSolvePnP, { EXPOSURE_ROUNDS } from './autoSolvePnP';

const params = { d: [[0]], k: [[1]] } as any;
// 16 distinct points, in the order of the reference points: four per quadrant
const points = Array.from({ length: 16 }, (_, i) => [i, i * 10] as [number, number]);
const firstRound = [...EXPOSURE_ROUNDS[0]];
const allExposures = EXPOSURE_ROUNDS.flat();

/** every setExposure / setCameraExposureAuto call in the order it happened */
let cameraCalls: Array<[string, boolean | number]>;

describe('autoSolvePnP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
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
    mockAutoPnPMatch.mockResolvedValue({ filled: 0, matched: 16, points, rms: 0.4, success: true });
    mockSolvePnPCalculate.mockResolvedValue({ data: { rvec: [[1]], tvec: [[2]] }, success: true });
  });

  afterEach(() => jest.restoreAllMocks());

  test('solves the four quadrants from the first round and restores the exposure', async () => {
    const res = await autoSolvePnP(params);

    expect(mockUpdateData).toHaveBeenCalledWith(params);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(firstRound.length);
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(1);

    const [refPoints, blobs, weak] = mockAutoPnPMatch.mock.calls[0];

    expect(refPoints).toHaveLength(16);
    expect(refPoints.slice(0, 4)).toEqual(bm2PnPPoints.topLeft);
    expect(blobs).toHaveLength(firstRound.length);
    expect(weak).toHaveLength(firstRound.length);

    expect(mockSolvePnPCalculate.mock.calls).toEqual([
      [0, points.slice(0, 4), [...bm2PnPPoints.topLeft]],
      [0, points.slice(4, 8), [...bm2PnPPoints.topRight]],
      [0, points.slice(8, 12), [...bm2PnPPoints.bottomLeft]],
      [0, points.slice(12, 16), [...bm2PnPPoints.bottomRight]],
    ]);
    expect(res).toEqual({
      highResidual: false,
      imgPoints: {
        bottomLeft: points.slice(8, 12),
        bottomRight: points.slice(12, 16),
        topLeft: points.slice(0, 4),
        topRight: points.slice(4, 8),
      },
      rms: 0.4,
      rvecs: { bottomLeft: [[1]], bottomRight: [[1]], topLeft: [[1]], topRight: [[1]] },
      success: true,
      tvecs: { bottomLeft: [[2]], bottomRight: [[2]], topLeft: [[2]], topRight: [[2]] },
    });
    expect(cameraCalls).toEqual([...firstRound.map((e) => ['exposure', e]), ['exposure', 320]]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('shoots the second round only when marks are missing', async () => {
    mockAutoPnPMatch.mockResolvedValueOnce({ matched: 14, reason: 'NOT_ENOUGH_MARKS', success: false });

    const res = await autoSolvePnP(params);

    expect(res.success).toBe(true);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(allExposures.length);
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(2);
    // the second match gets every photo so far, not just the new ones
    expect(mockAutoPnPMatch.mock.calls[1][1]).toHaveLength(allExposures.length);
    expect(cameraCalls).toEqual([...allExposures.map((e) => ['exposure', e]), ['exposure', 320]]);
  });

  test('reports missing marks after both rounds', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 14, reason: 'NOT_ENOUGH_MARKS', rms: 0.3, success: false });

    const res = await autoSolvePnP(params);

    expect(res).toEqual({ matched: 14, reason: 'NOT_ENOUGH_MARKS', rms: 0.3, success: false });
    expect(mockAutoPnPMatch).toHaveBeenCalledTimes(2);
    expect(mockSolvePnPCalculate).not.toHaveBeenCalled();
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test('solves a high residual anyway, without more photos, and flags it for the caller', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 16, points, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });

    const res = await autoSolvePnP(params);

    expect(res).toMatchObject({ highResidual: true, rms: 1.8, success: true });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(firstRound.length);
    expect(mockSolvePnPCalculate).toHaveBeenCalledTimes(4);
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
  });

  test('reports a high residual that comes without usable points', async () => {
    mockAutoPnPMatch.mockResolvedValue({ matched: 16, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });
    expect(await autoSolvePnP(params)).toEqual({ matched: 16, reason: 'HIGH_RESIDUAL', rms: 1.8, success: false });

    mockAutoPnPMatch.mockResolvedValue({ points: [null, ...points.slice(1)], reason: 'HIGH_RESIDUAL', success: false });
    expect((await autoSolvePnP(params)).success).toBe(false);
    expect(mockSolvePnPCalculate).not.toHaveBeenCalled();
  });

  test('stops at the first photo when the backend does not know the command', async () => {
    mockAutoPnPDetect.mockResolvedValue({ reason: 'UNSUPPORTED', success: false });

    const res = await autoSolvePnP(params);

    expect(res).toEqual({ reason: 'UNSUPPORTED', success: false });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockAutoPnPMatch).not.toHaveBeenCalled();
    expect(cameraCalls).toEqual([
      ['exposure', firstRound[0]],
      ['exposure', 320],
    ]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('reports a missing photo', async () => {
    mockTakeOnePicture.mockResolvedValue(null);

    expect(await autoSolvePnP(params)).toEqual({ reason: 'NO_IMAGE', success: false });
    expect(mockAutoPnPDetect).not.toHaveBeenCalled();
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('reports a quadrant that cannot be solved', async () => {
    mockSolvePnPCalculate
      .mockResolvedValueOnce({ data: { rvec: [[1]], tvec: [[2]] }, success: true })
      .mockResolvedValueOnce({ success: false });

    expect(await autoSolvePnP(params)).toEqual({ reason: 'SOLVE_PNP_FAILED', success: false });
    expect(mockSolvePnPCalculate).toHaveBeenCalledTimes(2);
  });

  test('restores the exposure and disconnects when a call throws', async () => {
    mockAutoPnPDetect.mockRejectedValue(new Error('socket closed'));

    await expect(autoSolvePnP(params)).rejects.toThrow('socket closed');
    expect(cameraCalls.at(-1)).toEqual(['exposure', 320]);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('turns auto exposure off before the first photo and back on after the exposure is restored', async () => {
    mockGetCameraExposureAuto.mockResolvedValue({ data: true, success: true });

    await autoSolvePnP(params);

    expect(cameraCalls).toEqual([
      ['auto', false],
      ...firstRound.map((e) => ['exposure', e]),
      ['exposure', 320],
      ['auto', true],
    ]);
  });

  test('leaves auto exposure alone when it is off or cannot be read', async () => {
    await autoSolvePnP(params);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    mockGetCameraExposureAuto.mockResolvedValue({ data: 'unknown command', success: false });
    await autoSolvePnP(params);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    mockGetCameraExposureAuto.mockRejectedValue(new Error('timeout'));
    expect((await autoSolvePnP(params)).success).toBe(true);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();

    // camera not connected: device-master returns null instead of a promise
    mockGetCameraExposureAuto.mockReturnValue(null);
    expect((await autoSolvePnP(params)).success).toBe(true);
    expect(mockSetCameraExposureAuto).not.toHaveBeenCalled();
  });
});
