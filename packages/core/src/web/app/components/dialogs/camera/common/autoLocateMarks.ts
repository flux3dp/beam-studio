import type { AutoPnPBlob, AutoPnPFailReason } from '@core/helpers/api/camera-calibration';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

export type AutoLocateMarksResult =
  | {
      /**
       * after `NOT_ENOUGH_MARKS`: a starting position for every mark, for placing them by hand. The found
       * marks are where they were found, the missing ones where the found ones predict them. Absent when too
       * few were found to predict from
       */
      initialPoints?: Array<[number, number]>;
      matched?: number;
      reason: 'CANCELLED' | 'NO_IMAGE' | AutoPnPFailReason;
      rms?: null | number;
      success: false;
    }
  | {
      /** every mark was found but the residual is over the limit: the caller decides whether to go on */
      highResidual: boolean;
      /** one image point per reference point, in the px space `solvePnPCalculate` takes */
      points: Array<[number, number]>;
      rms: number;
      success: true;
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
  /** checked before each photo and each match, and before the result is handed back: true ends with `CANCELLED` */
  isCancelled?: () => boolean;
  /** the detection needs `k` and `d` */
  params: FisheyeCaliParameters;
  /** mark positions on the bed, mm */
  refPoints: Array<[number, number]>;
  /** residual limit in mm for `HIGH_RESIDUAL`; the backend default suits 16 marks, 8-mark layouts pass their own */
  rMax?: number;
}

const locate = async ({
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
  let canSetExposure = true;

  await cameraCalibrationApi.updateData(params);

  try {
    await deviceMaster.connectCamera();

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

      let isAutoOff = !wasAutoExposure;

      if (wasAutoExposure) {
        try {
          isAutoOff = Boolean(await deviceMaster.setCameraExposureAuto(false));
        } catch (error) {
          console.error(error);
        }
      }

      if (!isAutoOff) {
        console.warn('[auto solve pnp] auto exposure cannot be turned off, using one photo as it is');
        wasAutoExposure = false;
        originalExposure = undefined;
        rounds = undefined;
      }
    }

    let matchRes: Awaited<ReturnType<typeof cameraCalibrationApi.autoPnPMatch>> | undefined;

    for (const round of rounds ?? [[undefined]]) {
      for (const exposure of round) {
        if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

        if (exposure !== undefined) {
          try {
            canSetExposure = await setExposure(exposure);
          } catch (error) {
            console.error(error);
            canSetExposure = false;
          }

          if (canSetExposure) {
            // the first photo after a change still has the old exposure (fbm2: every one of 7 changes); drop it
            await deviceMaster.takeOnePicture();

            if (isCancelled?.()) return { reason: 'CANCELLED', success: false };
          } else {
            console.warn('[auto solve pnp] exposure cannot be set, this photo is the last one');
          }
        }

        const imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;

        if (!imgBlob) return { reason: 'NO_IMAGE', success: false };

        if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

        const detectRes = await cameraCalibrationApi.autoPnPDetect(imgBlob);

        if (!detectRes.success) return { reason: detectRes.reason as AutoPnPFailReason, success: false };

        shot.push(canSetExposure ? exposure : undefined);
        blobs.push(detectRes.blobs);
        weak.push(detectRes.weak);

        if (!canSetExposure) break;
      }

      if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

      matchRes = await cameraCalibrationApi.autoPnPMatch(refPoints, blobs, weak, rMax);

      if (isCancelled?.()) return { reason: 'CANCELLED', success: false };

      console.log('[auto solve pnp]', {
        // the values set for each photo; 'current' when the exposure was left alone
        exposures: shot.map((e) => e ?? 'current'),
        restoredTo: originalExposure,
        wasAutoExposure,
        ...matchRes,
        points: undefined,
      });

      // more photos only help when marks are missing; a high residual is about k / d
      if (matchRes.success || matchRes.reason !== 'NOT_ENOUGH_MARKS' || !canSetExposure) break;
    }

    if (!matchRes) return { reason: 'NOT_ENOUGH_MARKS', success: false };

    const highResidual = !matchRes.success && matchRes.reason === 'HIGH_RESIDUAL';
    const points = matchRes.points as Array<[number, number]> | undefined;

    if (!points || (!matchRes.success && !(highResidual && points.every(Boolean)))) {
      const { matched, predicted, reason, rms } = matchRes as Extract<typeof matchRes, { success: false }>;
      const initialPoints = predicted && matchRes.points?.map((point, i) => point ?? predicted[i]);

      return { initialPoints: initialPoints || undefined, matched, reason, rms, success: false };
    }

    return { highResidual, points, rms: matchRes.rms ?? 0, success: true };
  } finally {
    if (originalExposure !== undefined) await setExposure(originalExposure).catch(() => {});

    if (wasAutoExposure) await Promise.resolve(deviceMaster.setCameraExposureAuto(true)).catch(() => {});

    deviceMaster.disconnectCamera();
  }
};

/**
 * Photograph the engraved calibration marks and tell which image point is which mark, without user input.
 * The camera must already be at the position the pose is wanted for.
 */
const autoLocateMarks = async (options: Options): Promise<AutoLocateMarksResult> => {
  const result = await locate(options);

  return result.success && options.isCancelled?.() ? { reason: 'CANCELLED', success: false } : result;
};

export default autoLocateMarks;
