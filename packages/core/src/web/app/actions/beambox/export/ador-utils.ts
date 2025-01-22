import constant from '@core/app/actions/beambox/constant';
import deviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export const getAdorPaddingAccel = async (device: IDeviceInfo | null): Promise<null | number> => {
  if (!constant.adorModels.includes(device?.model)) {
    return null;
  }

  try {
    await deviceMaster.select(device);

    const deviceDetailInfo = await deviceMaster.getDeviceDetailInfo();
    const xAcc = Number.parseInt(deviceDetailInfo.x_acc, 10);

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
