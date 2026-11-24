import type { AutoPnPBlob, AutoPnPFailReason } from '@core/helpers/api/camera-calibration';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

export type AutoLocateMarksResult =
  | {
      /** every mark was found but the residual is over the limit: the caller decides whether to go on */
      highResidual: boolean;
      /** one image point per reference point, in the px space `solvePnPCalculate` takes */
      points: Array<[number, number]>;
      rms: number;
      success: true;
    }
  | {
      matched?: number;
      reason: 'CANCELLED' | 'NO_IMAGE' | AutoPnPFailReason;
      rms?: null | number;
      success: false;
    };

interface Options {
  /** which camera to shoot with on machines that have two (`deviceMaster.setCamera`) */
  cameraIndex?: number;
  /**
   * Exposures to shoot, in rounds: a later round is only shot when marks are still missing, and every match
   * gets all photos so far. Omit to take one photo at the camera's current exposure and leave exposure alone;
   * the same happens when the machine cannot report its exposure (older firmware).
   */
  exposureRounds?: ReadonlyArray<ReadonlyArray<number>>;
  /** checked before each photo: true stops the capture with `CANCELLED` (dialog closed, door opened) */
  isCancelled?: () => boolean;
  /** the detection needs `k` and `d` */
  params: FisheyeCaliParameters;
  /** mark positions on the bed, mm */
  refPoints: Array<[number, number]>;
  /** residual limit in mm for `HIGH_RESIDUAL`; the backend default suits 16 marks, 8-mark layouts pass their own */
  rMax?: number;
}

/**
 * Photograph the engraved calibration marks and tell which image point is which mark, without user input.
 * The camera must already be at the position the pose is wanted for.
 */
const autoLocateMarks = async ({
  cameraIndex,
  exposureRounds,
  isCancelled,
  params,
  refPoints,
  rMax,
}: Options): Promise<AutoLocateMarksResult> => {
  const blobs: AutoPnPBlob[][] = [];
  const weak: AutoPnPBlob[][] = [];
  const shot: Array<number | undefined> = [];
  let rounds = exposureRounds;
  let originalExposure: number | undefined;
  let wasAutoExposure = false;

  await cameraCalibrationApi.updateData(params);
  await deviceMaster.connectCamera();

  try {
    if (cameraIndex !== undefined && !(await deviceMaster.setCamera(cameraIndex))) {
      return { reason: 'NO_IMAGE', success: false };
    }

    if (rounds) {
      try {
        originalExposure = (await getExposureSettings()).value;
      } catch (error) {
        console.warn('[auto solve pnp] exposure is not available, using one photo as it is', error);
      }

      // without a value to restore, the exposure is not touched at all
      if (typeof originalExposure !== 'number') rounds = undefined;
    }

    if (rounds) {
      // a fixed exposure is ignored while the camera adjusts it on its own
      const autoRes = await deviceMaster.getCameraExposureAuto()?.catch(() => null);

      wasAutoExposure = Boolean(autoRes?.success && autoRes.data);

      if (wasAutoExposure) await deviceMaster.setCameraExposureAuto(false);
    }

    let matchRes: Awaited<ReturnType<typeof cameraCalibrationApi.autoPnPMatch>> | undefined;

    for (const round of rounds ?? [[undefined]]) {
      for (const exposure of round) {
        if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

        if (exposure !== undefined) {
          await setExposure(exposure);
          // the first photo after a change still has the old exposure (fbm2: every one of 7 changes); drop it
          await deviceMaster.takeOnePicture();
        }

        const imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;

        if (!imgBlob) return { reason: 'NO_IMAGE', success: false };

        const detectRes = await cameraCalibrationApi.autoPnPDetect(imgBlob);

        if (!detectRes.success) return { reason: detectRes.reason as AutoPnPFailReason, success: false };

        shot.push(exposure);
        blobs.push(detectRes.blobs);
        weak.push(detectRes.weak);
      }

      matchRes = await cameraCalibrationApi.autoPnPMatch(refPoints, blobs, weak, rMax);
      console.log('[auto solve pnp]', {
        // the values set for each photo; 'current' when the exposure was left alone
        exposures: shot.map((e) => e ?? 'current'),
        restoredTo: originalExposure,
        wasAutoExposure,
        ...matchRes,
        points: undefined,
      });

      // more photos only help when marks are missing; a high residual is about k / d
      if (matchRes.success || matchRes.reason !== 'NOT_ENOUGH_MARKS') break;
    }

    if (!matchRes) return { reason: 'NOT_ENOUGH_MARKS', success: false };

    const highResidual = !matchRes.success && matchRes.reason === 'HIGH_RESIDUAL';
    const points = matchRes.points as Array<[number, number]> | undefined;

    if (!points || (!matchRes.success && !(highResidual && points.every(Boolean)))) {
      const { matched, reason, rms } = matchRes as Extract<typeof matchRes, { success: false }>;

      return { matched, reason, rms, success: false };
    }

    return { highResidual, points, rms: matchRes.rms ?? 0, success: true };
  } finally {
    if (originalExposure !== undefined) await setExposure(originalExposure).catch(() => {});

    if (wasAutoExposure) await Promise.resolve(deviceMaster.setCameraExposureAuto(true)).catch(() => {});

    deviceMaster.disconnectCamera();
  }
};

export default autoLocateMarks;
