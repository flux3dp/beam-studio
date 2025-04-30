import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import getFocalDistance from '@core/helpers/device/camera/getFocalDistance';
import deviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const PROGRESS_ID = 'get-height';

const getHeight = async (device: IDeviceInfo, progressId?: string, defaultValue?: number): Promise<null | number> => {
  if (!progressId) {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID });
  }

  if (device.model === 'fbb2') {
    try {
      const height = await getFocalDistance();

      return height;
    } catch (e) {
      console.error('Fail to get focal distance', e);

      return null;
    } finally {
      progressCaller.popById(progressId || PROGRESS_ID);
    }
  }

  try {
    progressCaller.update(progressId || PROGRESS_ID, { message: 'Getting probe position' });

    const res = await deviceMaster.rawGetProbePos();
    const { didAf, z } = res;

    if (didAf) {
      const { deep } = getWorkarea(device.model as WorkAreaModel, 'ado1');

      return Math.round((deep - z) * 100) / 100;
    }
  } catch (e) {
    console.log('Fail to get probe position, using custom height', e);
  }

  if (typeof defaultValue === 'number') {
    return defaultValue;
  }

  // hide progress for dialogCaller
  progressCaller.popById(progressId || PROGRESS_ID);

  const height = await dialogCaller.getPreviewHeight({ initValue: undefined });

  return height;
};

export default getHeight;
