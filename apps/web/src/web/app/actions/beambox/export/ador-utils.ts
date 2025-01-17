import constant from 'app/actions/beambox/constant';
import deviceMaster from 'helpers/device-master';
import { IDeviceInfo } from 'interfaces/IDevice';

export const getAdorPaddingAccel = async (device: IDeviceInfo | null): Promise<number | null> => {
  if (!constant.adorModels.includes(device?.model)) return null;
  try {
    await deviceMaster.select(device);
    const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
    const xAcc = parseInt(deviceDetailInfo.x_acc, 10);
    // handle nan and 0
    return Number.isNaN(xAcc) || !xAcc ? null : xAcc;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default {
  getAdorPaddingAccel,
};
