import alertCaller from '@core/app/actions/alert-caller';
import getLevelingData from '@core/app/actions/camera/preview-helper/getLevelingData';
import { showCalibrateCamera } from '@core/app/actions/dialog-controller';
import progressCaller from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import {
  addFisheyeCalibrateImg,
  doFishEyeCalibration,
  startFisheyeCalibrate,
} from '@core/helpers/camera-calibration-helper';
import { uploadJson } from '@core/helpers/device/jsonDataHelper';
import deviceMaster from '@core/helpers/device-master';
import durationFormatter from '@core/helpers/duration-formatter';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

export const calibrateWithDevicePictures = async (): Promise<FisheyeCameraParametersV2Cali | null> => {
  const {
    lang: { calibration: tCali, camera_data_backup: tCameraData },
  } = i18n;
  const progressId = 'calibrate-with-device-pictures';
  let canceled = false;

  try {
    progressCaller.openSteppingProgress({
      id: progressId,
      message: tCali.downloading_pictures,
      onCancel: () => {
        canceled = true;
      },
    });

    const ls = await deviceMaster.ls('camera_calib');
    const { files } = ls as { files: string[] };
    const [names, heights] = files.reduce(
      (acc: [string[], string[]], name) => {
        const res = name.match(/^pic_([-\d.]+)_top_left\.jpg$/);

        if (res) {
          const height = res[1];

          acc[0].push(name);
          acc[1].push(height);
        }

        return acc;
      },
      [[], []],
    );

    await startFisheyeCalibrate();

    if (canceled) {
      return null;
    }

    let s = Date.now();

    for (let i = 0; i < names.length; i += 1) {
      if (canceled) {
        return null;
      }

      const [, blob] = await deviceMaster.downloadFile('camera_calib', names[i], ({ left, size }) => {
        const current = 1 - left / size;
        const totalProgress = (current + i) / names.length;
        const timeElapsed = (Date.now() - s) / 1000;
        const timeLeft = durationFormatter(timeElapsed / totalProgress - timeElapsed);

        progressCaller.update(progressId, {
          message: `${tCali.downloading_pictures} ${i + 1}/${names.length}<br/>${
            tCameraData.estimated_time_left
          } ${timeLeft}`,
          percentage: Math.round(100 * totalProgress),
        });
      });

      const res = await addFisheyeCalibrateImg(Number.parseFloat(heights[i]), blob);

      if (!res) {
        console.warn(`Fail to add image of height ${heights[i]}`);
      }
    }

    if (canceled) {
      return null;
    }

    progressCaller.update(progressId, {
      message: tCali.calibrating_with_device_pictures,
      percentage: 0,
    });
    s = Date.now();

    const data = await doFishEyeCalibration((val) => {
      if (val > 0) {
        const timeElapsed = (Date.now() - s) / 1000;
        const timeLeft = durationFormatter(timeElapsed / val - timeElapsed);

        progressCaller.update(progressId, {
          message: `${tCali.calibrating_with_device_pictures}<br/>${tCameraData.estimated_time_left} ${timeLeft}`,
          percentage: Math.round(100 * val),
        });
      }
    });

    if (canceled) {
      return null;
    }

    return {
      d: data.d,
      k: data.k,
      rvec: data.rvec,
      rvec_polyfit: data.rvec_polyfit,
      tvec: data.tvec,
      tvec_polyfit: data.tvec_polyfit,
    };
  } catch (error) {
    console.error(error);
    alertCaller.popUpError({ message: tCali.failed_to_calibrate_with_pictures });

    return null;
  } finally {
    progressCaller.popById(progressId);
  }
};

export const saveCheckPoint = async (param: FisheyeCameraParametersV2Cali): Promise<void> => {
  await uploadJson(param, 'fisheye', 'checkpoint.json');
};

/**
 * Obtain camera parameters from the raw photos taken on the device at the factory (the old
 * `CheckPictures` flow). When photos exist, calibrate from them, upload the result to the device,
 * and persist it to `checkpoint.json` so the (time-consuming) computation is only done once. The
 * returned param can then be used as `currentData` to open the dialog at the put-paper step.
 * Returns `null` (and shows the appropriate alert) when there are no photos or calibration fails.
 */
export const calibrateFromDevicePictures = async (): Promise<FisheyeCameraParametersV2Cali | null> => {
  const { lang } = i18n;
  const progressId = 'camera-check-pictures';

  progressCaller.openNonstopProgress({ id: progressId, message: lang.calibration.checking_pictures });

  let hasPictures = false;

  try {
    const ls = await deviceMaster.ls('camera_calib');

    hasPictures = ls.files.length > 0;
  } catch {
    /* do nothing */
  } finally {
    progressCaller.popById(progressId);
  }

  if (!hasPictures) {
    alertCaller.popUpError({
      buttons: [
        { isLeft: true, label: lang.alert.cancel },
        {
          label: lang.topbar.menu.calibrate_camera_advanced,
          onClick: () => showCalibrateCamera(deviceMaster.currentDevice!.info, { isAdvanced: true }),
          type: 'primary',
        },
      ],
      message: lang.calibration.no_picture_found,
    });

    return null;
  }

  const levelingData = await getLevelingData('hexa_platform');
  const refHeight = levelingData.A;

  Object.keys(levelingData).forEach((key) => {
    levelingData[key] = refHeight - levelingData[key];
  });

  const res = await calibrateWithDevicePictures();

  if (!res) {
    // calibrateWithDevicePictures already alerted on failure / cancel.
    return null;
  }

  const param: FisheyeCameraParametersV2Cali = { ...res, levelingData, refHeight: 0, source: 'device' };

  await saveCheckPoint(param);

  return param;
};

export const getMaterialHeight = async (position: 'A' | 'E' = 'E'): Promise<number> => {
  const device = deviceMaster.currentDevice!;

  await deviceMaster.enterRawMode();
  await deviceMaster.rawHome();
  await deviceMaster.rawStartLineCheckMode();

  const workarea = getWorkarea(device.info.model as WorkAreaModel, 'ado1');
  const { cameraCenter, deep = 40.5 } = workarea;

  if (cameraCenter && position === 'E') {
    await deviceMaster.rawMove({ f: 7500, x: cameraCenter[0], y: cameraCenter[1] });
  }

  await deviceMaster.rawEndLineCheckMode();
  await deviceMaster.rawAutoFocus();

  const { didAf, z } = await deviceMaster.rawGetProbePos();

  if (cameraCenter && position === 'E') {
    await deviceMaster.rawMove({ f: 7500, x: 0, y: 0 });
  }

  await deviceMaster.rawLooseMotor();
  await deviceMaster.endSubTask();

  if (!didAf) {
    throw new Error('Auto focus failed');
  }

  return Math.round((deep - z) * 100) / 100;
};

export const prepareToTakePicture = async (): Promise<void> => {
  await deviceMaster.enterRawMode();
  await deviceMaster.rawHome();
  await deviceMaster.rawHomeZ();
  await deviceMaster.rawLooseMotor();
  await deviceMaster.endSubTask();
};

export default {
  calibrateWithDevicePictures,
  getMaterialHeight,
  prepareToTakePicture,
  saveCheckPoint,
};
