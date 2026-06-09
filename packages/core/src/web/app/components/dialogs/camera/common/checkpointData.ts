import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import i18n from '@core/helpers/i18n';
import type {
  FisheyeCaliParameters,
  FisheyeCameraParametersV2,
  FisheyeCameraParametersV3,
  FisheyeCameraParametersV4,
} from '@core/interfaces/FisheyePreview';

const PROGRESS_ID = 'camera-check-point';

interface CheckpointResult<T> {
  data: T;
  isCheckPointData?: boolean;
}

/**
 * Load the existing camera calibration parameters for a calibration flow.
 * Tries `getData` (or `fisheye_params.json` by default), normalizes V4/V3/V2 params,
 * and optionally falls back to `checkpoint.json`. Returns `null` when nothing usable
 * is found. Replaces the load logic that used to live inside the CheckpointData dialog.
 */
export const getCheckpointData = async <T extends FisheyeCaliParameters>({
  allowCheckPoint = true,
  getData,
}: {
  allowCheckPoint?: boolean;
  getData?: () => Promise<T> | T;
} = {}): Promise<CheckpointResult<T> | null> => {
  // Non-blocking loading toast so the UI stays responsive while we fetch before the dialog opens.
  MessageCaller.openMessage({
    content: i18n.lang.calibration.checking_checkpoint,
    key: PROGRESS_ID,
    level: MessageLevel.LOADING,
  });

  try {
    try {
      const res: FisheyeCaliParameters = getData
        ? await getData()
        : ((await loadJson('fisheye', 'fisheye_params.json')) as T);

      const isV4 = (d: any): d is FisheyeCameraParametersV4 => d.v === 4;

      if (isV4(res)) {
        return {
          data: { d: res.d, is_fisheye: res.is_fisheye, k: res.k, rvec: res.rvec, tvec: res.tvec } as T,
        };
      }

      const isV3 = (d: any): d is FisheyeCameraParametersV3 => d.v === 3;

      if (isV3(res)) {
        return {
          data: { d: res.d, is_fisheye: res.is_fisheye, k: res.k, rvec: res.rvec, tvec: res.tvec } as T,
        };
      }

      const isV2 = (d: any): d is FisheyeCameraParametersV2 => d.v === 2;

      if (isV2(res)) {
        return {
          data: {
            d: res.d,
            is_fisheye: res.is_fisheye,
            k: res.k,
            refHeight: res.refHeight,
            rvec: res.rvec,
            source: res.source,
            tvec: res.tvec,
          } as T,
        };
      }
    } catch {
      /* do nothing */
    }

    if (allowCheckPoint) {
      try {
        const data = (await loadJson('fisheye', 'checkpoint.json')) as T;

        if (data) {
          return { data, isCheckPointData: true };
        }
      } catch {
        /* do nothing */
      }
    }

    return null;
  } finally {
    MessageCaller.closeMessage(PROGRESS_ID);
  }
};

/**
 * Apply checkpoint parameters by uploading them to the device. Callers that also need the params
 * in the in-progress calibrating ref (e.g. skip-button flows) call `updateParam` themselves after
 * this resolves. Returns `false` on failure.
 */
export const applyCheckpointData = async (data: FisheyeCaliParameters): Promise<boolean> => {
  progressCaller.openNonstopProgress({
    id: PROGRESS_ID,
    message: i18n.lang.calibration.downloading_checkpoint,
  });

  try {
    await cameraCalibrationApi.updateData(data);

    return true;
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: i18n.lang.calibration.failed_to_parse_checkpoint });

    return false;
  } finally {
    progressCaller.popById(PROGRESS_ID);
  }
};
