import { promarkModels } from 'app/actions/beambox/constant';
import deviceMaster from 'helpers/device-master';
import webcamHelper from 'helpers/webcam-helper';
import { IDeviceInfo } from 'interfaces/IDevice';

// according video resolution, 2400 * 1600 from [webcamHelper](src/web/helpers/webcam-helper.ts)
const PROMARK_GOOD_PICTURE_THRESHOLD = (2400 * 1600) / 4;

const checkCameraCommon = async (device: IDeviceInfo): Promise<boolean> => {
  try {
    const selectResult = await deviceMaster.select(device);

    if (!selectResult.success) {
      throw new Error(selectResult.error || 'Fail to select device');
    }

    await deviceMaster.connectCamera();
    await deviceMaster.takeOnePicture();
    deviceMaster.disconnectCamera();

    return true;
  } catch (e) {
    console.log(e);
  }

  return false;
};

const checkCameraPromark = async (_device: IDeviceInfo): Promise<boolean> => {
  try {
    const isWebCamExist = await webcamHelper.getDevice();

    if (!isWebCamExist) {
      return false;
    }

    const webcam = await webcamHelper.connectWebcam();
    const pic = await webcam.getPicture();

    // size bigger than PROMARK_GOOD_PICTURE_THRESHOLD is considered as a good picture
    return pic.size > PROMARK_GOOD_PICTURE_THRESHOLD;
  } catch (e) {
    console.log(e);
  }

  return false;
};

const checkCamera = async (device: IDeviceInfo): Promise<boolean> => {
  if (promarkModels.has(device.model)) {
    return checkCameraPromark(device);
  }

  return checkCameraCommon(device);
};

export default checkCamera;
