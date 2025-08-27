import deviceMaster from '@core/helpers/device-master';
import versionChecker from '@core/helpers/version-checker';
import type { IConfigSetting } from '@core/interfaces/IDevice';

export const getExposureSettings = async () => {
  const currentMode = deviceMaster.currentControlMode;
  const currentMachine = deviceMaster.currentDevice?.info;
  const vc = currentMachine ? versionChecker(currentMachine.version) : null;

  if (currentMode === 'raw' && vc?.meetRequirement('CAMERA_SOCKET_EXPOSURE')) {
    const res = await deviceMaster.getCameraExposure();

    if (!res?.success) throw new Error('Failed to get camera exposure');

    // Unable to get max, min, step during raw mode, use default values
    return { max: 1000, min: 50, step: 1, value: res.data } as IConfigSetting;
  }

  if (currentMode !== '') await deviceMaster.endSubTask();

  const exposureRes = await deviceMaster.getDeviceSetting('camera_exposure_absolute');

  return JSON.parse(exposureRes.value) as IConfigSetting;
};

export const setExposure = async (value: number): Promise<boolean> => {
  const currentMode = deviceMaster.currentControlMode;
  const currentMachine = deviceMaster.currentDevice?.info;
  const vc = currentMachine ? versionChecker(currentMachine.version) : null;

  if (currentMode === 'raw' && vc?.meetRequirement('CAMERA_SOCKET_EXPOSURE')) {
    const res = await deviceMaster.setCameraExposure(value);

    return res;
  }

  if (currentMode !== '') await deviceMaster.endSubTask();

  await deviceMaster.setDeviceSetting('camera_exposure_absolute', value.toString());

  return true;
};
