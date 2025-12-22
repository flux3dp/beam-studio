import { hexaRfModels } from '@core/app/actions/beambox/constant';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import versionChecker from '@core/helpers/version-checker';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export const getWideAngleCameraData = async (
  device: IDeviceInfo,
): Promise<{ hasWideAngleCamera: boolean; parameters?: FisheyeCaliParameters }> => {
  if (!(device.model === 'fbb2' || hexaRfModels.has(device.model))) {
    return { hasWideAngleCamera: false };
  }

  const vc = versionChecker(device.version);

  if (!vc.meetRequirement('BB2_WIDE_ANGLE_CAMERA') && !isDev()) {
    return { hasWideAngleCamera: false };
  }

  let didConnectCamera = false;

  try {
    if (!deviceMaster.currentDevice?.camera) {
      await deviceMaster.connectCamera();
      didConnectCamera = true;
    }

    const res = await deviceMaster.getCameraCount();

    if (!res.success || res.data < 2) {
      return { hasWideAngleCamera: false };
    }
  } catch (err) {
    console.log('Failed to get camera count:', err instanceof Error ? err?.message : err);

    return { hasWideAngleCamera: false };
  } finally {
    console.log('didConnectCamera:', didConnectCamera);

    if (didConnectCamera) {
      deviceMaster.disconnectCamera();
    }
  }

  let parameters: FisheyeCaliParameters | undefined;

  try {
    parameters = (await loadJson('fisheye', 'wide-angle.json')) as FisheyeCaliParameters;
  } catch (err) {
    console.log('Wide-angle camera parameters not found:', err instanceof Error ? err?.message : err);
  }

  return { hasWideAngleCamera: true, parameters };
};
