import alertCaller from '@core/app/actions/alert-caller';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParameters, FisheyePreviewManager } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PreviewManager, PreviewManagerArguments } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV1 from './FisheyePreviewManagerV1';
import FisheyePreviewManagerV2 from './FisheyePreviewManagerV2';

// TODO: Add tests
class AdorPreviewManager extends BasePreviewManager implements PreviewManager {
  protected _isFullScreen = true;
  private fisheyeManager?: FisheyePreviewManager;

  constructor(device: IDeviceInfo, args?: PreviewManagerArguments) {
    super(device, args);
    this.progressId = 'ador-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};

    if (progressId) {
      this.progressId = progressId;
    }

    try {
      this.showMessage({ message: lang.message.connectingCamera });
      await deviceMaster.connectCamera();

      let params: FisheyeCameraParameters;

      try {
        params = await deviceMaster.fetchFisheyeParams();
      } catch (err) {
        console.log('Fail to fetchFisheyeParams', err instanceof Error ? err?.message : err);
        throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
      }

      if (!('v' in params)) {
        this.fisheyeManager = new FisheyePreviewManagerV1(this.device, params);
      } else if (params.v === 2) {
        this.fisheyeManager = new FisheyePreviewManagerV2(this.device, params);
      }

      const res = await this.fisheyeManager!.setupFisheyePreview({ progressId: this.progressId });

      return res;
    } catch (error) {
      console.error(error);

      if ((error as Error).message && (error as Error).message.startsWith('Camera WS')) {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${(error as Error).message || ''}`,
        });
      } else {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${(error as Error).message || ''}`,
        });
      }

      return false;
    } finally {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();
        this.updateMessage({ message: lang.message.endingRawMode });
        await deviceMaster.endSubTask();
      }

      this.closeMessage();
    }
  };

  public end = async (): Promise<void> => {};

  reloadLevelingOffset = async (): Promise<void> => {
    await this.fisheyeManager?.reloadLevelingOffset();
  };

  resetObjectHeight = async (): Promise<boolean> => (await this.fisheyeManager?.resetObjectHeight()) ?? false;

  public preview = async (): Promise<boolean> => {
    try {
      MessageCaller.openMessage({
        content: i18n.lang.topbar.preview,
        duration: 20,
        key: 'full-area-preview',
        level: MessageLevel.LOADING,
      });

      const imgUrl = await this.getPhotoFromMachine();

      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      MessageCaller.openMessage({
        content: i18n.lang.message.preview.succeeded,
        duration: 3,
        key: 'full-area-preview',
        level: MessageLevel.SUCCESS,
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

  public previewFullWorkarea? = async (): Promise<boolean> => {
    const res = await this.preview();

    return res;
  };
}

export default AdorPreviewManager;
