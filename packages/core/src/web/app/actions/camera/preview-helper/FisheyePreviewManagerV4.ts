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
      progressId?: string;
    } = {},
  ): Promise<boolean> {
    const { lang } = i18n;
    const { progressId } = args;

    if (!progressId) progressCaller.openNonstopProgress({ id: this.progressId });

    const { params } = this;

    await rawAndHome(progressId || this.progressId);

    progressCaller.update(progressId || this.progressId, { message: 'Getting focal distance...' });

    const height = await getFocalDistance();

    this.objectHeight = height;
    progressCaller.update(progressId || this.progressId, { message: lang.message.endingRawMode });
    await deviceMaster.endSubTask();
    params.grids = this.grids;
    await deviceMaster.setFisheyeParam(params);
    await this.onObjectHeightChanged();

    if (!progressId) progressCaller.popById(this.progressId);

    return true;
  }

  onObjectHeightChanged = async (): Promise<void> => {
    await deviceMaster.setFisheyeObjectHeight(this.objectHeight);
  };
}

export default FisheyePreviewManagerV4;
