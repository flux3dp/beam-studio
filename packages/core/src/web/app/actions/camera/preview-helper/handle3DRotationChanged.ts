import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import type { RotationParameters3DCalibration } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const handle3DRotationChanged = async (
  params: RotationParameters3DCalibration,
  height: number,
  device: IDeviceInfo,
): Promise<void> => {
  console.log('Applying', params);

  const { ch, rx, ry, rz, sh, tx = 0, ty = 0 } = params;
  const { deep } = getWorkarea(device.model as WorkAreaModel, 'ado1');
  const z = deep - height;
  const rotationZ = sh * (z + ch);

  await deviceMaster.set3dRotation({ h: rotationZ, rx, ry, rz, tx, ty });
};

export default handle3DRotationChanged;
