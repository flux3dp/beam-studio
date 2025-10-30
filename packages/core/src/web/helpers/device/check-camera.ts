import { promarkModels } from '@core/app/actions/beambox/constant';
import deviceMaster from '@core/helpers/device-master';
import webcamHelper from '@core/helpers/webcam-helper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

interface CheckCameraResult {
  error?: string;
  success: boolean;
}

// according video resolution, 2400 * 1600 from [webcamHelper](src/web/helpers/webcam-helper.ts)
const PROMARK_GOOD_PICTURE_THRESHOLD = (2400 * 1600) / 4;

const checkCameraCommon = async (device: IDeviceInfo): Promise<CheckCameraResult> => {
  try {
    const selectResult = await deviceMaster.select(device);

    if (!selectResult.success) {
      throw new Error(selectResult.error || 'Fail to select device');
    }

    await deviceMaster.connectCamera();
    await deviceMaster.takeOnePicture();
    deviceMaster.disconnectCamera();

    return { success: true };
  } catch (e) {
    console.log(e);
  }

  return { success: false };
};

const checkCameraPromark = async (_device: IDeviceInfo): Promise<CheckCameraResult> => {
  try {
    const isWebCamExist = await webcamHelper.getDevice();

    if (!isWebCamExist) {
      return { success: false };
    }

    const webcam = await webcamHelper.connectWebcam();

    if (!webcam) return { success: false };

    const pic = await webcam.getPicture();

    // size bigger than PROMARK_GOOD_PICTURE_THRESHOLD is considered as a good picture
    if (pic.size <= PROMARK_GOOD_PICTURE_THRESHOLD) return { error: 'Picture too small', success: false };

    return { success: true };
  } catch (e) {
    console.log(e);
  }

  return { success: false };
};

const checkCamera = async (device: IDeviceInfo): Promise<CheckCameraResult> => {
  if (promarkModels.has(device.model)) {
    return checkCameraPromark(device);
  }

  return checkCameraCommon(device);
};

export default checkCamera;
