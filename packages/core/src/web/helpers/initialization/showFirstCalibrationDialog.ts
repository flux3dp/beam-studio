import alertCaller from '@core/app/actions/alert-caller';
import { calibrateCamera } from '@core/app/components/dialogs/camera';
import alertConstants from '@core/app/constants/alert-constants';

import alertConfig from '../api/alert-config';
import { discoverManager } from '../api/discover';
import getDevice from '../device/get-device';
import i18n from '../i18n';
import isWeb from '../is-web';

const askFirstTimeCameraCalibration = () =>
  new Promise<boolean>((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption: i18n.lang.topbar.menu.calibrate_beambox_camera,
      message: i18n.lang.tutorial.suggest_calibrate_camera_first,
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });

const doFirstTimeCameraCalibration = async (): Promise<boolean> => {
  const askForRetry = () =>
    new Promise<boolean>((resolve) => {
      const t = i18n.lang.tutorial;

      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        caption: t.camera_calibration_failed,
        message: t.ask_retry_calibration,
        onNo: async () => resolve(false),
        onYes: async () => resolve(await doFirstTimeCameraCalibration()),
      });
    });

  const { device } = await getDevice();

  if (!device) return false;

  try {
    return await calibrateCamera(device);
  } catch (e) {
    console.error(e);

    return await askForRetry();
  }
};

const showFirstCalibrationDialog = async (isNewUser: boolean): Promise<boolean> => {
  const hasDoneFirstCali = alertConfig.read('done-first-cali');
  let hasMachineConnection = discoverManager.checkConnection();
  // in web, wait for websocket connection
  const web = isWeb();

  if (web && !hasDoneFirstCali && !hasMachineConnection) {
    await new Promise((r) => setTimeout(r, 1000));
    hasMachineConnection = discoverManager.checkConnection();
  }

  const shouldShow = web ? hasMachineConnection && !hasDoneFirstCali : isNewUser || !hasDoneFirstCali;
  let caliRes = true;

  if (shouldShow) {
    const res = await askFirstTimeCameraCalibration();

    alertConfig.write('done-first-cali', true);

    if (res) {
      caliRes = await doFirstTimeCameraCalibration();
    } else {
      return false;
    }
  }

  return caliRes;
};

export default showFirstCalibrationDialog;
