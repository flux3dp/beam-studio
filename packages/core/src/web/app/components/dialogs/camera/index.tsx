import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import checkCamera from '@core/helpers/device/check-camera';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import AdorCalibrationV2 from './AdorCalibrationV2';
import LaserHeadFisheyeCalibration from './LaserHeadFisheyeCalibration';
import ModuleCalibration from './ModuleCalibration';
import PromarkCalibration from './PromarkCalibration';

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

  const cameraStatus = await checkCamera(device);

  if (!cameraStatus) {
    alertCaller.popUp({
      caption: i18n.lang.alert.oops,
      message: i18n.lang.web_cam.no_device,
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
