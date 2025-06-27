import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import MessageCaller from '@core/app/actions/message-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { bm2PerspectiveGrid } from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { CameraType } from '@core/app/constants/cameraConstants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV4 } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import { MessageLevel } from '@core/interfaces/IMessage';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV4 from './FisheyePreviewManagerV4';

class Beamo2PreviewManager extends BasePreviewManager implements PreviewManager {
  private cameraType: CameraType = CameraType.LASER_HEAD;
  private lineCheckEnabled: boolean = false;
  private fisheyeParams?: FisheyeCameraParametersV4;
  private fisheyePreviewManager?: FisheyePreviewManagerV4;
  private grid = bm2PerspectiveGrid;
  protected maxMovementSpeed: [number, number] = [54000, 6000]; // mm/min, speed cap of machine

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'beamo2-preview-manager';
  }

  get isFullScreen(): boolean {
    return true;
  }

  protected getMovementSpeed = (): number => {
    const previewMovementSpeedLevel = beamboxPreference.read('preview_movement_speed_level');

    return match(previewMovementSpeedLevel)
      .with(PreviewSpeedLevel.FAST, () => 42000)
      .with(PreviewSpeedLevel.MEDIUM, () => 36000)
      .with(PreviewSpeedLevel.SLOW, () => 30000)
      .otherwise(() => 30000);
  };

  private handleSetupError = async (error: unknown): Promise<void> => {
    const { lang } = i18n;

    await this.end();
    console.log('Error when setting up beamo2 Preview Manager', error);

    if (error instanceof Error && error.message.startsWith('Camera WS')) {
      alertCaller.popUpError({
        message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
      });
    } else {
      alertCaller.popUpError({
        message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${error instanceof Error ? error.message : ''}`,
      });
    }
  };

  private setUpCamera = async (): Promise<boolean> => {
    const { lang } = i18n;

    try {
      progressCaller.update(this.progressId, { percentage: 20 });

      if (!this.fisheyeParams) {
        try {
          this.fisheyeParams = (await deviceMaster.fetchFisheyeParams()) as FisheyeCameraParametersV4;
        } catch (err) {
          console.log('Fail to fetchFisheyeParams', err);
          throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
        }
      }

      this.fisheyePreviewManager = new FisheyePreviewManagerV4(this.device, this.fisheyeParams, this.grid);
      progressCaller.update(this.progressId, { percentage: 40 });

      const workarea = getWorkarea(this.device.model, 'fbm2');
      const { cameraCenter } = workarea;

      return await this.fisheyePreviewManager.setupFisheyePreview({
        cameraPosition: cameraCenter,
        height: 0,
        progressId: this.progressId,
        progressRange: [40, 100],
      });
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    } finally {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();

        if (this.lineCheckEnabled) await deviceMaster.rawEndLineCheckMode();

        progressCaller.update(this.progressId, { message: lang.message.endingRawMode });
        await deviceMaster.endSubTask();
      }
    }
  };

  public setup = async ({ progressId }: { progressId?: string } = {}): Promise<boolean> => {
    if (progressId) this.progressId = progressId;

    const { lang } = i18n;

    try {
      progressCaller.openSteppingProgress({
        id: this.progressId,
        message: sprintf(lang.message.connectingMachine, this.device.name),
      });
      await deviceMaster.connectCamera();

      const res = await this.setUpCamera();

      return res;
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    } finally {
      progressCaller.popById(this.progressId);
    }
  };

  private endCameraPreview = async (disconnectCamera: boolean = true): Promise<void> => {
    const res = await deviceMaster.select(this.device);

    if (res.success) {
      if (disconnectCamera) deviceMaster.disconnectCamera();

      deviceMaster.kick();
    }
  };

  end = async (): Promise<void> => {
    this.ended = true;
    MessageCaller.closeMessage('camera-preview');

    try {
      if (this.cameraType === CameraType.LASER_HEAD) {
        await this.endCameraPreview();
      }
    } catch (error) {
      console.log('Failed to end Beamo2PreviewManager', error);
    }
  };

  public preview = async (): Promise<boolean> => {
    try {
      MessageCaller.openMessage({
        content: i18n.lang.topbar.preview,
        duration: 20,
        key: this.progressId,
        level: MessageLevel.LOADING,
      });

      const imgUrl = await this.getPhotoFromMachine();

      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      MessageCaller.openMessage({
        content: 'Successfully previewed',
        duration: 3,
        key: this.progressId,
        level: MessageLevel.SUCCESS,
      });

      return true;
    } catch (error) {
      MessageCaller.closeMessage(this.progressId);
      throw error;
    }
  };

  public previewRegion = (): Promise<boolean> => {
    return this.preview();
  };

  public previewFullWorkarea = (): Promise<boolean> => {
    return this.preview();
  };

  getCameraType = (): CameraType => this.cameraType;
}

export default Beamo2PreviewManager;
