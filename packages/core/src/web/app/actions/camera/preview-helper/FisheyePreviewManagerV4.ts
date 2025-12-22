import progressCaller from '@core/app/actions/progress-caller';
import getFocalDistance from '@core/helpers/device/camera/getFocalDistance';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type {
  FisheyeCameraParametersV4,
  FisheyePreviewManager,
  PerspectiveGrid,
} from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import FisheyePreviewManagerBase from './FisheyePreviewManagerBase';
import rawAndHome from './rawAndHome';

class FisheyePreviewManagerV4 extends FisheyePreviewManagerBase implements FisheyePreviewManager {
  declare params: FisheyeCameraParametersV4;
  private grids: PerspectiveGrid;

  constructor(device: IDeviceInfo, params: FisheyeCameraParametersV4, grids: PerspectiveGrid) {
    super();
    this.device = device;
    this.params = params;
    this.grids = grids;
  }

  async setupFisheyePreview(
    args: {
      cameraPosition?: number[];
      closeMessage?: () => void;
      height?: number;
      movementFeedrate?: number;
      shouldKeepInRawMode?: boolean;
      updateMessage?: (message: string) => void;
    } = {},
  ): Promise<boolean> {
    const { lang } = i18n;
    const { cameraPosition, height, movementFeedrate = 7500, shouldKeepInRawMode = false } = args;
    const showMessage = args.updateMessage ? null : () => progressCaller.openNonstopProgress({ id: this.progressId });
    const updateMessage =
      args.updateMessage || ((message: string) => progressCaller.update(this.progressId, { message }));
    const closeMessage = args.closeMessage || (() => progressCaller.popById(this.progressId));

    showMessage?.();

    const { params } = this;

    await rawAndHome(updateMessage);
    updateMessage(lang.message.preview.moving_to_preview_position);

    if (cameraPosition) {
      await deviceMaster.rawMove({ f: movementFeedrate, x: cameraPosition[0], y: cameraPosition[1] });

      const dist = (cameraPosition[0] ** 2 + cameraPosition[1] ** 2) ** 0.5;
      const time = (dist / (movementFeedrate / 60)) * 2; // safety factor 2

      await new Promise((resolve) => setTimeout(resolve, time * 1000));
    }

    if (height === undefined) {
      updateMessage(lang.message.preview.getting_focal_distance);

      this.objectHeight = await getFocalDistance();
    } else {
      this.objectHeight = height;
    }

    if (!shouldKeepInRawMode) {
      updateMessage(lang.message.endingRawMode);
      await deviceMaster.endSubTask();
    }

    params.grids = this.grids;
    updateMessage(lang.message.connectingCamera);
    await deviceMaster.setFisheyeParam(params);
    await this.onObjectHeightChanged();
    closeMessage?.();

    return true;
  }

  onObjectHeightChanged = async (): Promise<void> => {
    await deviceMaster.setFisheyeObjectHeight(this.objectHeight);
  };
}

export default FisheyePreviewManagerV4;
