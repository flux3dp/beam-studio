import deviceMaster from 'helpers/device-master';
import durationFormatter from 'helpers/duration-formatter';
import i18n from 'helpers/i18n';
import progressCaller from 'app/actions/progress-caller';
import {
  addFisheyeCalibrateImg,
  doFishEyeCalibration,
  startFisheyeCalibrate,
} from 'helpers/camera-calibration-helper';
import { FisheyeCameraParametersV2Cali } from 'interfaces/FisheyePreview';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import alertCaller from 'app/actions/alert-caller';

export const calibrateWithDevicePictures =
  async (): Promise<FisheyeCameraParametersV2Cali | null> => {
    const { lang } = i18n;
    const tCali = lang.calibration;
    const tCameraData = lang.camera_data_backup;
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
        [[], []]
      );
      await startFisheyeCalibrate();
      if (canceled) return null;
      let s = Date.now();
      for (let i = 0; i < names.length; i += 1) {
        if (canceled) return null;
        // eslint-disable-next-line no-await-in-loop
        const [, blob] = await deviceMaster.downloadFile(
          'camera_calib',
          names[i],
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          ({ left, size }) => {
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
          }
        );
        // eslint-disable-next-line no-await-in-loop
        const res = await addFisheyeCalibrateImg(parseFloat(heights[i]), blob);
        if (!res) console.warn(`Fail to add image of height ${heights[i]}`);
      }
      if (canceled) return null;
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
      if (canceled) return null;
      return {
        k: data.k,
        d: data.d,
        rvec: data.rvec,
        tvec: data.tvec,
        rvec_polyfit: data.rvec_polyfit,
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
  const dataString = JSON.stringify(param);
  const dataBlob = new Blob([dataString], { type: 'application/json' });
  await deviceMaster.uploadToDirectory(dataBlob, 'fisheye', 'checkpoint.json');
};

export const getMaterialHeight = async (position: 'A' | 'E' = 'E'): Promise<number> => {
  const device = deviceMaster.currentDevice;
  await deviceMaster.enterRawMode();
  await deviceMaster.rawHome();
  await deviceMaster.rawStartLineCheckMode();
  const workarea = getWorkarea(device.info.model as WorkAreaModel, 'ado1');
  const { cameraCenter, deep } = workarea;
  if (cameraCenter && position === 'E') await deviceMaster.rawMove({ x: cameraCenter[0], y: cameraCenter[1], f: 7500 });
  await deviceMaster.rawEndLineCheckMode();
  await deviceMaster.rawAutoFocus();
  const { didAf, z } = await deviceMaster.rawGetProbePos();
  if (cameraCenter && position === 'E') await deviceMaster.rawMove({ x: 0, y: 0, f: 7500 });
  await deviceMaster.rawLooseMotor();
  await deviceMaster.endRawMode();
  if (!didAf) throw new Error('Auto focus failed');
  return Math.round((deep - z) * 100) / 100;
};

export const prepareToTakePicture = async (): Promise<void> => {
  await deviceMaster.enterRawMode();
  await deviceMaster.rawHome();
  await deviceMaster.rawHomeZ();
  await deviceMaster.rawLooseMotor();
  await deviceMaster.endRawMode();
};

export default {
  calibrateWithDevicePictures,
  getMaterialHeight,
  prepareToTakePicture,
  saveCheckPoint,
};
