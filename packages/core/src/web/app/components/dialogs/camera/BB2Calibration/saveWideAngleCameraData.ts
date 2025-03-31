import deviceMaster from '@core/helpers/device-master';
import type { FisheyeCameraParametersV2 } from '@core/interfaces/FisheyePreview';

export const saveWideAngleCameraData = async (param: FisheyeCameraParametersV2): Promise<void> => {
  const dataString = JSON.stringify(param);
  const dataBlob = new Blob([dataString], { type: 'application/json' });

  await deviceMaster.uploadToDirectory(dataBlob, 'fisheye', 'wide-angle.json');
};

export default saveWideAngleCameraData;
