import { bm2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import type { AutoPnPBlob, AutoPnPFailReason } from '@core/helpers/api/camera-calibration';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import type { FisheyeCameraParametersV4Cali } from '@core/interfaces/FisheyePreview';

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
      reason: 'NO_IMAGE' | 'SOLVE_PNP_FAILED' | AutoPnPFailReason;
      rms?: null | number;
      success: false;
    };

/**
 * Locate the 16 engraved marks and solve the four quadrant poses without user input.
 * The camera must already be at the calibration position with the motors held.
 */
const autoSolvePnP = async (params: FisheyeCameraParametersV4Cali): Promise<AutoSolvePnPResult> => {
  const refPoints = REGIONS.flatMap((region) => [...bm2PnPPoints[region]]) as Array<[number, number]>;
  const blobs: AutoPnPBlob[][] = [];
  const weak: AutoPnPBlob[][] = [];
  let originalExposure: number | undefined;
  let wasAutoExposure = false;

  await cameraCalibrationApi.updateData(params);
  await deviceMaster.connectCamera();

  try {
    originalExposure = (await getExposureSettings()).value;

    // a fixed exposure is ignored while the camera adjusts it on its own
    const autoRes = await deviceMaster.getCameraExposureAuto()?.catch(() => null);

    wasAutoExposure = Boolean(autoRes?.success && autoRes.data);

    if (wasAutoExposure) await deviceMaster.setCameraExposureAuto(false);

    let matchRes: Awaited<ReturnType<typeof cameraCalibrationApi.autoPnPMatch>> | undefined;

    for (const round of EXPOSURE_ROUNDS) {
      for (const exposure of round) {
        await setExposure(exposure);

        const imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;

        if (!imgBlob) return { reason: 'NO_IMAGE', success: false };

        const detectRes = await cameraCalibrationApi.autoPnPDetect(imgBlob);

        if (!detectRes.success) return { reason: detectRes.reason as AutoPnPFailReason, success: false };

        blobs.push(detectRes.blobs);
        weak.push(detectRes.weak);
      }

      matchRes = await cameraCalibrationApi.autoPnPMatch(refPoints, blobs, weak);
      console.log('[auto solve pnp]', { exposures: blobs.length, ...matchRes, points: undefined });

      // more photos only help when marks are missing; a high residual is about k / d
      if (matchRes.success || matchRes.reason !== 'NOT_ENOUGH_MARKS') break;
    }

    if (!matchRes) return { reason: 'NOT_ENOUGH_MARKS', success: false };

    const highResidual = !matchRes.success && matchRes.reason === 'HIGH_RESIDUAL';
    const allPoints = matchRes.points as Array<[number, number]> | undefined;

    if (!allPoints || (!matchRes.success && !(highResidual && allPoints.every(Boolean)))) {
      return matchRes as AutoSolvePnPResult;
    }

    const result = {
      highResidual,
      imgPoints: {},
      rms: matchRes.rms ?? 0,
      rvecs: {},
      success: true,
      tvecs: {},
    } as Extract<AutoSolvePnPResult, { success: true }>;

    for (let i = 0; i < REGIONS.length; i++) {
      const region = REGIONS[i];
      const points = allPoints.slice(i * 4, i * 4 + 4);
      const res = await cameraCalibrationApi.solvePnPCalculate(0, points, [...bm2PnPPoints[region]]);

      if (!res.success) return { reason: 'SOLVE_PNP_FAILED', success: false };

      result.imgPoints[region] = points;
      result.rvecs[region] = res.data.rvec;
      result.tvecs[region] = res.data.tvec;
    }

    return result;
  } finally {
    if (originalExposure !== undefined) await setExposure(originalExposure).catch(() => {});

    if (wasAutoExposure) await Promise.resolve(deviceMaster.setCameraExposureAuto(true)).catch(() => {});

    deviceMaster.disconnectCamera();
  }
};

export default autoSolvePnP;
