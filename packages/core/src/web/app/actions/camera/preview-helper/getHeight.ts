import deviceMaster from 'helpers/device-master';
import dialogCaller from 'app/actions/dialog-caller';
import progressCaller from 'app/actions/progress-caller';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

const PROGRESS_ID = 'get-height';

const getHeight = async (device: IDeviceInfo, progressId?: string, defaultValue?: number): Promise<number> => {
  if (!progressId) progressCaller.openNonstopProgress({ id: PROGRESS_ID });
  try {
    progressCaller.update(progressId || PROGRESS_ID, { message: 'Getting probe position' });
    const res = await deviceMaster.rawGetProbePos();
    const { z, didAf } = res;
    if (didAf) {
      const { deep } = getWorkarea(device.model as WorkAreaModel, 'ado1');
      return Math.round((deep - z) * 100) / 100;
    }
  } catch (e) {
    console.log('Fail to get probe position, using custom height', e);
  }
  if (typeof(defaultValue) === 'number') return defaultValue;
  // hide progress for dialogCaller
  progressCaller.popById(progressId || PROGRESS_ID);
  const height = await dialogCaller.getPreviewHeight({ initValue: undefined });
  return height;
};

export default getHeight;
