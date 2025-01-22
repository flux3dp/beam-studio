import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParameters, FisheyePreviewManager } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import getLevelingData from './getLevelingData';

class FisheyePreviewManagerBase implements FisheyePreviewManager {
  version: number;

  device: IDeviceInfo;

  params: FisheyeCameraParameters;

  support3dRotation = false;

  objectHeight: number;

  levelingData: Record<string, number>;

  levelingOffset: Record<string, number>;

  progressId = 'fisheye-preview-manager';

  setupFisheyePreview(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  onObjectHeightChanged(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async reloadLevelingOffset(): Promise<void> {
    this.levelingOffset = await getLevelingData('offset');
    this.onObjectHeightChanged();
  }

  async resetObjectHeight(): Promise<boolean> {
    let res = false;

    try {
      const newHeight = await dialogCaller.getPreviewHeight({
        initValue: this.objectHeight,
      });

      if (typeof newHeight === 'number') {
        this.objectHeight = newHeight;
        await this.onObjectHeightChanged();
        res = true;
      }

      return res;
    } finally {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();
        progressCaller.update(this.progressId, { message: i18n.lang.message.endingRawMode });
        await deviceMaster.endRawMode();
      }

      progressCaller.popById(this.progressId);
    }
  }
}

export default FisheyePreviewManagerBase;
