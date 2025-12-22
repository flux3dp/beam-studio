import dialogCaller from '@core/app/actions/dialog-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const getHeight = async (
  device: IDeviceInfo,
  {
    closeMessage,
    defaultValue,
    updateMessage,
  }: {
    closeMessage?: () => void;
    defaultValue?: number;
    updateMessage?: (message: string) => void;
  } = {},
): Promise<null | number> => {
  try {
    updateMessage?.('Getting probe position');

    const res = await deviceMaster.rawGetProbePos();
    const { didAf, z } = res;

    if (didAf) {
      const { deep } = getWorkarea(device.model as WorkAreaModel, 'ado1');

      return Math.round((deep! - z) * 100) / 100;
    }
  } catch (e) {
    console.log('Fail to get probe position, using custom height', e);
  }

  if (typeof defaultValue === 'number') {
    return defaultValue;
  }

  // hide progress for dialogCaller
  closeMessage?.();

  const height = await dialogCaller.getPreviewHeight({ initValue: undefined });

  return height;
};

export default getHeight;
