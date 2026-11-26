import { bm2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import type { AutoPnPFailReason } from '@core/helpers/api/camera-calibration';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import type { FisheyeCameraParametersV4Cali } from '@core/interfaces/FisheyePreview';

import autoLocateMarks from '../common/autoLocateMarks';

const REGIONS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;

type Region = (typeof REGIONS)[number];

/**
 * Exposure rounds. The lighting sits below the work area, so no single exposure shows every mark on every
 * unit: the first round covers the units measured (one needs 75 alone, one needs 75 + 200), the second is only
 * taken when marks are still missing and reaches both ways. 50 is the camera's minimum; on the units measured
 * nothing above 500 found a mark the lower values missed, 800 is there for a unit with weaker lighting.
 */
export const EXPOSURE_ROUNDS = [
  [75, 200],
  [50, 125, 350, 500, 800],
] as const;

export type AutoSolvePnPResult =
  | {
      /** every mark was found but the residual is over the gate: the caller asks the user before going on */
      highResidual: boolean;
      imgPoints: Record<Region, Array<[number, number]>>;
      rms: number;
      rvecs: Record<Region, number[][]>;
      success: true;
      tvecs: Record<Region, number[][]>;
    }
  | {
      matched?: number;
      reason: 'CANCELLED' | 'NO_IMAGE' | 'SOLVE_PNP_FAILED' | AutoPnPFailReason;
      rms?: null | number;
      success: false;
    };

/**
 * Locate the 16 engraved marks and solve the four quadrant poses without user input.
 * The camera must already be at the calibration position with the motors held.
 */
const autoSolvePnP = async (
  params: FisheyeCameraParametersV4Cali,
  isCancelled?: () => boolean,
): Promise<AutoSolvePnPResult> => {
  const refPoints = REGIONS.flatMap((region) => [...bm2PnPPoints[region]]) as Array<[number, number]>;
  const located = await autoLocateMarks({ exposureRounds: EXPOSURE_ROUNDS, isCancelled, params, refPoints });

  if (!located.success) return located;

  const result = {
    highResidual: located.highResidual,
    imgPoints: {},
    rms: located.rms,
    rvecs: {},
    success: true,
    tvecs: {},
  } as Extract<AutoSolvePnPResult, { success: true }>;

  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i];
    const points = located.points.slice(i * 4, i * 4 + 4);

    if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

    const res = await cameraCalibrationApi.solvePnPCalculate(0, points, [...bm2PnPPoints[region]]);

    if (!res.success) return { reason: 'SOLVE_PNP_FAILED', success: false };

    result.imgPoints[region] = points;
    result.rvecs[region] = res.data.rvec;
    result.tvecs[region] = res.data.tvec;
  }

  return result;
};

export default autoSolvePnP;
