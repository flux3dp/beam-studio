import deviceMaster from 'helpers/device-master';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

const getAutoFocusPosition = async (device: IDeviceInfo): Promise<string> => {
  const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
  const { width, height } = workarea;
  const lastPosition = await deviceMaster.rawGetLastPos();
  const { x, y } = lastPosition;
  let xIndex = 0;
  if (x > width * (2 / 3)) xIndex = 2;
  else if (x > width * (1 / 3)) xIndex = 1;
  let yIndex = 0;
  if (y > height * (2 / 3)) yIndex = 2;
  else if (y > height * (1 / 3)) yIndex = 1;
  const refKey = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][yIndex * 3 + xIndex];
  console.log('Probe position', lastPosition, 'refKey', refKey);
  return refKey;
};

export default getAutoFocusPosition;
