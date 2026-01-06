import alertCaller from '@core/app/actions/alert-caller';
import constant, { modelsWithWideAngleCamera, promarkModels } from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { showCameraCalibration } from '@core/app/components/dialogs/camera/CameraCalibration/CameraCalibration';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import checkDeviceStatus from '@core/helpers/check-device-status';
import checkCamera from '@core/helpers/device/check-camera';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import AdorCalibrationV2 from './AdorCalibrationV2';
import { showBeamo2Calibration } from './beamo2Calibration';
import LaserHeadFisheyeCalibration from './LaserHeadFisheyeCalibration';
import ModuleCalibration from './ModuleCalibration';
import PromarkCalibration from './PromarkCalibration';
import WideAngleCamera from './WideAngleCamera';

export const showLaserHeadFisheyeCalibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'laser-head-fisheye-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <LaserHeadFisheyeCalibration
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export const showWideAngleCameraCalibration = async (device: IDeviceInfo): Promise<boolean> => {
  const id = 'wide-angle-camera-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) onClose();

  const vc = versionChecker(device.version);

  if (device.model === 'fbb2' && !vc.meetRequirement('BB2_WIDE_ANGLE_CAMERA') && !isDev()) return false;

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

export const showModuleCalibration = async (module?: LayerModuleType): Promise<boolean> => {
  const DIALOG_ID = 'module-calibration';

  if (isIdExist(DIALOG_ID)) {
    return false;
  }

  return new Promise((resolve) => {
    addDialogComponent(
      DIALOG_ID,
      <ModuleCalibration
        module={module}
        onClose={(completed = false) => {
          popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};

export const showPromarkCalibration = async (device: IDeviceInfo): Promise<boolean> => {
  const id = 'promark-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  const { error: cameraError, success: cameraStatus } = await checkCamera(device);

  if (!cameraStatus) {
    alertCaller.popUp({
      caption: i18n.lang.alert.oops,
      message: cameraError ?? i18n.lang.web_cam.no_device,
      messageIcon: 'warning',
    });

    return false;
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <PromarkCalibration
        device={device}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export const showAdorCalibrationV2 = async (factoryMode = false): Promise<boolean> => {
  const DIALOG_ID = 'fisheye-calibration-v2';

  if (isIdExist(DIALOG_ID)) {
    return false;
  }

  return new Promise((resolve) => {
    addDialogComponent(
      DIALOG_ID,
      <AdorCalibrationV2
        factoryMode={factoryMode}
        onClose={(completed = false) => {
          popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};

export const calibrateCamera = async (
  device: IDeviceInfo,
  {
    factoryMode = false,
    isAdvanced = false,
    isBorderless = false,
    isWideAngle = false,
  }: { factoryMode?: boolean; isAdvanced?: boolean; isBorderless?: boolean; isWideAngle?: boolean } = {},
): Promise<boolean> => {
  try {
    const deviceStatus = await checkDeviceStatus(device);

    if (!deviceStatus) {
      return false;
    }

    const res = await deviceMaster.select(device);

    if (res.success) {
      if (constant.adorModels.includes(device.model)) {
        return showAdorCalibrationV2(factoryMode);
      } else if (modelsWithWideAngleCamera.includes(device.model)) {
        if (isWideAngle) return showWideAngleCameraCalibration(device);
        else return showLaserHeadFisheyeCalibration(isAdvanced);
      } else if (promarkModels.has(device.model)) {
        return showPromarkCalibration(device);
      } else if (device.model === 'fbm2') {
        return showBeamo2Calibration(isAdvanced);
      }

      return showCameraCalibration(device, isBorderless);
    }

    return false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
