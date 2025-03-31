import alertCaller from '@core/app/actions/alert-caller';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV2, FisheyePreviewManager } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV2 from './FisheyePreviewManagerV2';

// TODO: Add tests
class BB2WideAngleCameraPreviewManager extends BasePreviewManager implements PreviewManager {
  public isFullScreen = true;
  private fisheyeManager?: FisheyePreviewManager;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'bb2-wide-angle-camera-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};

    if (progressId) {
      this.progressId = progressId;
    }

    try {
      progressCaller.openNonstopProgress({
        id: this.progressId,
        message: lang.message.connectingCamera,
      });
      await deviceMaster.connectCamera();

      const cameraCount = await deviceMaster.getCameraCount();

      if (!cameraCount.success || cameraCount.data < 2) {
        throw new Error('tUnable to connect to field camera.');
      }

      if (!(await deviceMaster.setCamera(1))) {
        throw new Error('tUnable to connect to field camera.');
      }

      let params: FisheyeCameraParametersV2;

      try {
        const data = await deviceMaster.downloadFile('fisheye', 'wide-angle.json');
        const [, blob] = data;
        const dataString = await (blob as Blob).text();

        params = JSON.parse(dataString) as FisheyeCameraParametersV2;
      } catch (err) {
        console.log('Fail to fetchFisheyeParams', err instanceof Error ? err?.message : err);
        throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
      }
      console.log('params', params);
      this.fisheyeManager = new FisheyePreviewManagerV2(this.device, params);

      const res = await this.fisheyeManager.setupFisheyePreview({ progressId: this.progressId });

      return res;
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message.startsWith('Camera WS')) {
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
        await deviceMaster.endSubTask();
      }

      progressCaller.popById(this.progressId);
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
        content: 'Successfully previewed',
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

export default BB2WideAngleCameraPreviewManager;
