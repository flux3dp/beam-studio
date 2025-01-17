import alertCaller from 'app/actions/alert-caller';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import progressCaller from 'app/actions/progress-caller';
import { FisheyeCameraParameters, FisheyePreviewManager } from 'interfaces/FisheyePreview';
import { IDeviceInfo } from 'interfaces/IDevice';
import { PreviewManager } from 'interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV1 from './FisheyePreviewManagerV1';
import FisheyePreviewManagerV2 from './FisheyePreviewManagerV2';

// TODO: Add tests
class AdorPreviewManager extends BasePreviewManager implements PreviewManager {
  public isFullScreen = true;
  private fisheyeManager: FisheyePreviewManager;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'ador-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};
    if (progressId) this.progressId = progressId;
    try {
      progressCaller.openNonstopProgress({
        id: this.progressId,
        message: lang.message.connectingCamera,
      });
      await deviceMaster.connectCamera();
      let params: FisheyeCameraParameters;
      try {
        params = await deviceMaster.fetchFisheyeParams();
      } catch (err) {
        console.log('Fail to fetchFisheyeParams', err?.message);
        throw new Error(
          'Unable to get fisheye parameters, please make sure you have calibrated the camera'
        );
      }
      if (!('v' in params)) {
        this.fisheyeManager = new FisheyePreviewManagerV1(this.device, params);
      } else if (params.v === 2) {
        this.fisheyeManager = new FisheyePreviewManagerV2(this.device, params);
      }
      const res = await this.fisheyeManager.setupFisheyePreview({ progressId: this.progressId });
      return res;
    } catch (error) {
      console.error(error);
      if (error.message && error.message.startsWith('Camera WS')) {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
        });
      } else {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
        });
      }
      return false;
    } finally {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();
        progressCaller.update(this.progressId, { message: lang.message.endingRawMode });
        await deviceMaster.endRawMode();
      }
      progressCaller.popById(this.progressId);
    }
  };

  public end = async (): Promise<void> => {};

  reloadLevelingOffset = async (): Promise<void> => {
    await this.fisheyeManager?.reloadLevelingOffset();
  };

  resetObjectHeight = async (): Promise<boolean> =>
    (await this.fisheyeManager?.resetObjectHeight()) ?? false;

  public preview = async (): Promise<boolean> => {
    try {
      MessageCaller.openMessage({
        key: 'full-area-preview',
        content: i18n.lang.topbar.preview,
        level: MessageLevel.LOADING,
        duration: 20,
      });
      const imgUrl = await this.getPhotoFromMachine();
      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      MessageCaller.openMessage({
        key: 'full-area-preview',
        level: MessageLevel.SUCCESS,
        content: 'Successfully previewed',
        duration: 3,
      });
      return true;
    } catch (error) {
      MessageCaller.closeMessage('full-area-preview');
      throw error;
    }
  };

  public previewRegion = async (): Promise<boolean> => {
    const res = await this.preview();
    return res;
  };

  public previewFullWorkarea? =  async(): Promise<boolean> => {
    const res = await this.preview();
    return res;
  };
}

export default AdorPreviewManager;
