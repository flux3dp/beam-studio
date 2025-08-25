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
      height?: number;
      movementFeedrate?: number;
      progressId?: string;
      progressRange?: [number, number];
      shouldKeepInRawMode?: boolean;
    } = {},
  ): Promise<boolean> {
    const { lang } = i18n;
    const {
      cameraPosition,
      height,
      movementFeedrate = 7500,
      progressId,
      progressRange: [progressStart, progressEnd] = [0, 100],
      shouldKeepInRawMode = false,
    } = args;

    if (!progressId) progressCaller.openNonstopProgress({ id: this.progressId });

    progressCaller.update(progressId || this.progressId, {
      percentage: progressStart,
    });

    const { params } = this;

    await rawAndHome(progressId || this.progressId);
    progressCaller.update(progressId || this.progressId, {
      message: lang.message.preview.moving_to_preview_position,
      percentage: progressStart + (progressEnd - progressStart) * 0.5,
    });

    if (cameraPosition) {
      await deviceMaster.rawMove({ f: movementFeedrate, x: cameraPosition[0], y: cameraPosition[1] });

      const dist = (cameraPosition[0] ** 2 + cameraPosition[1] ** 2) ** 0.5;
      const time = (dist / (movementFeedrate / 60)) * 2; // safety factor 2

      await new Promise((resolve) => setTimeout(resolve, time * 1000));
    }

    progressCaller.update(progressId || this.progressId, {
      percentage: progressStart + (progressEnd - progressStart) * 0.75,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (height === undefined) {
      progressCaller.update(progressId || this.progressId, { message: 'Getting focal distance...' });

      this.objectHeight = await getFocalDistance();
    } else {
      this.objectHeight = height;
    }

    if (!shouldKeepInRawMode) {
      progressCaller.update(progressId || this.progressId, { message: lang.message.endingRawMode });
      await deviceMaster.endSubTask();
    }

    params.grids = this.grids;
    progressCaller.update(progressId || this.progressId, { message: lang.message.connectingCamera });
    await deviceMaster.setFisheyeParam(params);
    await this.onObjectHeightChanged();

    progressCaller.update(progressId || this.progressId, {
      percentage: progressEnd,
    });

    if (!progressId) progressCaller.popById(this.progressId);

    return true;
  }

  onObjectHeightChanged = async (): Promise<void> => {
    await deviceMaster.setFisheyeObjectHeight(this.objectHeight);
  };
}

export default FisheyePreviewManagerV4;
