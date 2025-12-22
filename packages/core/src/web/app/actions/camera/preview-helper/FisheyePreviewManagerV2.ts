import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV2, FisheyePreviewManager } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import FisheyePreviewManagerBase from './FisheyePreviewManagerBase';
import getAutoFocusPosition from './getAutoFocusPosition';
import getHeight from './getHeight';
import getLevelingData from './getLevelingData';
import rawAndHome from './rawAndHome';

class FisheyePreviewManagerV2 extends FisheyePreviewManagerBase implements FisheyePreviewManager {
  declare params: FisheyeCameraParametersV2;

  autoFocusRefKey: string = 'A';

  version = 2;

  constructor(device: IDeviceInfo, params: FisheyeCameraParametersV2) {
    super();
    this.device = device;
    this.params = params;
  }

  async setupFisheyePreview(
    args: {
      closeMessage?: () => void;
      defaultHeight?: number;
      focusPosition?: string;
      updateMessage?: (message: string) => void;
    } = {},
  ): Promise<boolean> {
    const { lang } = i18n;
    const { defaultHeight, focusPosition } = args;
    const showMessage = args.updateMessage ? null : () => progressCaller.openNonstopProgress({ id: this.progressId });
    const updateMessage =
      args.updateMessage || ((message: string) => progressCaller.update(this.progressId, { message }));
    const closeMessage = args.closeMessage || (() => progressCaller.popById(this.progressId));
    const { device, params } = this;

    showMessage?.();
    updateMessage('Fetching leveling data...');
    this.levelingOffset = await getLevelingData('offset');
    await rawAndHome(updateMessage);

    const height = await getHeight(device, { closeMessage, defaultValue: defaultHeight, updateMessage });

    if (typeof height !== 'number') {
      return false;
    }

    this.objectHeight = height;
    showMessage?.();
    updateMessage(lang.message.getProbePosition);
    this.autoFocusRefKey = focusPosition ?? (await getAutoFocusPosition(device));
    updateMessage(lang.message.endingRawMode);
    await deviceMaster.endSubTask();
    // V2 calibration use point E as reference
    console.log(params);
    await deviceMaster.setFisheyeParam(params);
    await this.updateLevelingData();
    await this.onObjectHeightChanged();
    closeMessage?.();

    return true;
  }

  updateLevelingData = async (): Promise<void> => {
    const data = { ...this.params.levelingData };
    const keys = Object.keys(data);

    keys.forEach((key) => {
      data[key] = Math.round((data[key] + this.levelingOffset[key]) * 1000) / 1000;
    });
    await deviceMaster.setFisheyeLevelingData(this.levelingOffset);
  };

  async reloadLevelingOffset(): Promise<void> {
    this.levelingOffset = await getLevelingData('offset');
    await this.updateLevelingData();
    await this.onObjectHeightChanged();
  }

  onObjectHeightChanged = async (): Promise<void> => {
    const { autoFocusRefKey, levelingOffset, objectHeight, params } = this;
    const { levelingData = {}, source } = params;
    const refKey = source === 'device' ? 'A' : 'E';
    const heightCompensation =
      (levelingData[refKey] || 0) -
      (levelingData[autoFocusRefKey] || 0) -
      levelingOffset[refKey] +
      levelingOffset[autoFocusRefKey];
    const finalHeight = objectHeight + heightCompensation;

    await deviceMaster.setFisheyeObjectHeight(finalHeight);
  };
}

export default FisheyePreviewManagerV2;
