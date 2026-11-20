import { bm2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';

const mockSolvePnPCalculate = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: { solvePnPCalculate: (...args: any[]) => mockSolvePnPCalculate(...args) },
}));

const mockAutoLocateMarks = jest.fn();

jest.mock(
  '../common/autoLocateMarks',
  () =>
    (...args: any[]) =>
      mockAutoLocateMarks(...args),
);

import autoSolvePnP, { EXPOSURE_ROUNDS } from './autoSolvePnP';

const params = { d: [[0]], k: [[1]] } as any;
// 16 distinct points, in the order of the reference points: four per quadrant
const points = Array.from({ length: 16 }, (_, i) => [i, i * 10] as [number, number]);

describe('autoSolvePnP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAutoLocateMarks.mockResolvedValue({ highResidual: false, points, rms: 0.4, success: true });
    mockSolvePnPCalculate.mockResolvedValue({ data: { rvec: [[1]], tvec: [[2]] }, success: true });
  });

  test('locates the 16 marks with the beamo II exposure rounds and solves the four quadrants', async () => {
    const res = await autoSolvePnP(params);

    const [options] = mockAutoLocateMarks.mock.calls[0];

    expect(options.params).toBe(params);
    expect(options.exposureRounds).toBe(EXPOSURE_ROUNDS);
    expect(options.rMax).toBeUndefined();
    expect(options.refPoints).toHaveLength(16);
    expect(options.refPoints.slice(0, 4)).toEqual(bm2PnPPoints.topLeft);
    expect(options.refPoints.slice(12)).toEqual(bm2PnPPoints.bottomRight);

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
  });

  test('carries the high-residual flag', async () => {
    mockAutoLocateMarks.mockResolvedValue({ highResidual: true, points, rms: 1.8, success: true });

    expect(await autoSolvePnP(params)).toMatchObject({ highResidual: true, rms: 1.8, success: true });
    expect(mockSolvePnPCalculate).toHaveBeenCalledTimes(4);
  });

  test('passes a failure to locate the marks on without solving', async () => {
    const failure = { matched: 14, reason: 'NOT_ENOUGH_MARKS', rms: 0.3, success: false };

    mockAutoLocateMarks.mockResolvedValue(failure);

    expect(await autoSolvePnP(params)).toEqual(failure);
    expect(mockSolvePnPCalculate).not.toHaveBeenCalled();
  });

  test('reports a quadrant that cannot be solved', async () => {
    mockSolvePnPCalculate
      .mockResolvedValueOnce({ data: { rvec: [[1]], tvec: [[2]] }, success: true })
      .mockResolvedValueOnce({ success: false });

    expect(await autoSolvePnP(params)).toEqual({ reason: 'SOLVE_PNP_FAILED', success: false });
    expect(mockSolvePnPCalculate).toHaveBeenCalledTimes(2);
  });
});
