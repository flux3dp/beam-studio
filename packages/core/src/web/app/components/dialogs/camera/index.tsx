import alertCaller from '@core/app/actions/alert-caller';
import constant, { modelsWithWideAngleCamera, promarkModels } from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { showCameraCalibration } from '@core/app/components/dialogs/camera/CameraCalibration/CameraCalibration';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { eventEmitter } from '@core/app/contexts/DialogContext';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkCameraOblique } from '@core/helpers/device/camera/previewMode';
import checkCamera from '@core/helpers/device/check-camera';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import versionChecker from '@core/helpers/version-checker';
import type { FisheyeCameraParametersV3Cali, FisheyeCameraParametersV4Cali } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { showAdorCalibration } from './AdorCalibration';
import { showBeamo2Calibration } from './beamo2Calibration';
import { applyCheckpointData, getCheckpointData } from './common/checkpointData';
import LaserHeadFisheyeCalibration from './LaserHeadFisheyeCalibration';
import ModuleCalibration from './ModuleCalibration';
import PromarkCalibration from './PromarkCalibration';
import WideAngleCamera from './WideAngleCamera';

export const showLaserHeadFisheyeCalibration = async (device: IDeviceInfo, isAdvanced = false): Promise<boolean> => {
  const id = 'laser-head-fisheye-calibration';
  const isOblique = await checkCameraOblique(device);
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  let currentData: FisheyeCameraParametersV3Cali | undefined;

  if (!isAdvanced) {
    const res = await getCheckpointData<FisheyeCameraParametersV3Cali>({ allowCheckPoint: false });

    if (!res || !(await applyCheckpointData(res.data))) {
      alertCaller.popUpError({
        buttons: [
          { isLeft: true, label: i18n.lang.alert.cancel },
          {
            label: i18n.lang.topbar.menu.calibrate_camera_advanced,
            onClick: () => showLaserHeadFisheyeCalibration(device, true),
            type: 'primary',
          },
        ],
        message: i18n.lang.calibration.unable_to_load_camera_parameters,
      });

      return false;
    }

    currentData = res.data;
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <LaserHeadFisheyeCalibration
        currentData={currentData}
        isAdvanced={isAdvanced}
        isOblique={isOblique}
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

  const res = await getCheckpointData<FisheyeCameraParametersV4Cali>({
    allowCheckPoint: false,
    getData: async () => loadJson('fisheye', 'wide-angle.json') as Promise<FisheyeCameraParametersV4Cali>,
  });

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <WideAngleCamera
        currentData={res?.data ?? null}
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

  const currentData = promarkDataStore.get(device.serial, 'cameraParameters');

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <PromarkCalibration
        currentData={currentData}
        device={device}
        onClose={(completed = false) => {
          onClose();
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
        return showAdorCalibration({ factoryMode, isAdvanced });
      } else if (modelsWithWideAngleCamera.includes(device.model)) {
        if (isWideAngle) return showWideAngleCameraCalibration(device);
        else return showLaserHeadFisheyeCalibration(device, isAdvanced);
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

eventEmitter.on('SHOW_CALIBRATE_CAMERA', calibrateCamera);
