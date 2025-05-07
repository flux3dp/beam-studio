import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import LaserHead from './LaserHead';
import WideAngleCamera from './WideAngle';

export const showBB2Calibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'bb2-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <LaserHead
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export const showBB2WideAngleCameraCalibration = async (device: IDeviceInfo): Promise<boolean> => {
  const id = 'bb2-wide-angle-camera-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) onClose();

  const vc = versionChecker(device.version);

  if (!vc.meetRequirement('BB2_WIDE_ANGLE_CAMERA') && !isDev()) return false;

  await deviceMaster.connectCamera();

  const { data, success } = await deviceMaster.getCameraCount();

  if (!success) {
    alertCaller.popUpError({ message: 'Failed to get camera count' });

    return false;
  } else if (data < 2) {
    alertCaller.popUpError({ message: 'Failed to find camera 2' });

    return false;
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <WideAngleCamera
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export default {
  showBB2Calibration,
  showBB2WideAngleCameraCalibration,
};
