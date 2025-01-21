import deviceMaster from '@core/helpers/device-master';
import { RotationParameters3D } from '@core/interfaces/FisheyePreview';

const loadCamera3dRotation = async (): Promise<RotationParameters3D | null> => {
  try {
    const data = await deviceMaster.fetchFisheye3DRotation();
    return data;
  } catch (e) {
    console.error('Unable to get fisheye 3d rotation', e);
  }
  return null;
};

export default loadCamera3dRotation;
