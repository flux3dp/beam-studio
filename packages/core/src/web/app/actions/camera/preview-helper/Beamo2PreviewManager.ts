import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import DoorChecker from '@core/app/actions/camera/preview-helper/DoorChecker';
import MessageCaller from '@core/app/actions/message-caller';
import { bm2PerspectiveGrid } from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { CameraType } from '@core/app/constants/cameraConstants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { setMaskImage } from '@core/app/svgedit/canvasBackground';
import { setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV4 } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import { MessageLevel } from '@core/interfaces/IMessage';
import { ProgressTypes } from '@core/interfaces/IProgress';
import type { PreviewManager, PreviewManagerArguments } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV4 from './FisheyePreviewManagerV4';

class Beamo2PreviewManager extends BasePreviewManager implements PreviewManager {
  private cameraType: CameraType = CameraType.LASER_HEAD;
  private lineCheckEnabled: boolean = false;
  private fisheyeParams?: FisheyeCameraParametersV4;
  private fisheyePreviewManager?: FisheyePreviewManagerV4;
  private grid = bm2PerspectiveGrid;
  private doorChecker = new DoorChecker();
  private originalExposure: null | number = null;
  protected maxMovementSpeed: [number, number] = [45000, 6000]; // mm/min, speed cap of machine
  protected progressType = ProgressTypes.STEPPING;

  constructor(device: IDeviceInfo, args?: PreviewManagerArguments) {
    super(device, args);
    this.progressId = 'beamo2-preview-manager';
  }

  get isFullScreen(): boolean {
    return true;
  }

  protected getMovementSpeed = (): number => {
    const previewMovementSpeedLevel = useGlobalPreferenceStore.getState()['preview_movement_speed_level'];

    return match(previewMovementSpeedLevel)
      .with(PreviewSpeedLevel.FAST, () => 21000)
      .with(PreviewSpeedLevel.MEDIUM, () => 18000)
      .with(PreviewSpeedLevel.SLOW, () => 15000)
      .otherwise(() => 15000);
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
    try {
      this.updateMessage({ percentage: 20 });

      if (!this.fisheyeParams) {
        try {
          this.fisheyeParams = (await deviceMaster.fetchFisheyeParams()) as FisheyeCameraParametersV4;
        } catch (err) {
          console.log('Fail to fetchFisheyeParams', err);
          throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
        }
      }

      this.fisheyePreviewManager =
        this.fisheyePreviewManager ?? new FisheyePreviewManagerV4(this.device, this.fisheyeParams, this.grid);
      this.updateMessage({ percentage: 40 });

      const workarea = getWorkarea(this.device.model, 'fbm2');
      const { cameraCenter } = workarea;

      return await this.doorChecker.doorClosedWrapper(() =>
        this.fisheyePreviewManager!.setupFisheyePreview({
          cameraPosition: cameraCenter,
          height: 0,
          messageType: this.isBackgroundMode ? 'message' : 'progress',
          movementFeedrate: this.getMovementSpeed(),
          progressId: this.progressId,
          progressRange: [40, 100],
          shouldKeepInRawMode: true,
        }),
      );
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    }
  };

  public setup = async ({ progressId }: { progressId?: string } = {}): Promise<boolean> => {
    if (progressId) this.progressId = progressId;

    const { lang } = i18n;

    try {
      this.showMessage({ message: sprintf(lang.message.connectingMachine, this.device.name) });

      await deviceMaster.connectCamera();

      const res = await this.setUpCamera();

      return res;
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    } finally {
      this.closeMessage();
    }
  };

  private endCameraPreview = async (disconnectCamera: boolean = true): Promise<void> => {
    const res = await deviceMaster.select(this.device);

    if (res.success) {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();

        if (this.lineCheckEnabled) await deviceMaster.rawEndLineCheckMode();

        this.updateMessage({ message: i18n.lang.message.endingRawMode });
        await deviceMaster.endSubTask();
        this.closeMessage();
      }

      if (disconnectCamera) deviceMaster.disconnectCamera();

      if (this.originalExposure !== null) await setExposure(this.originalExposure);

      deviceMaster.kick();
    }
  };

  end = async (): Promise<void> => {
    this.ended = true;
    this.doorChecker.destroy();
    MessageCaller.closeMessage(this.progressId);

    try {
      if (this.cameraType === CameraType.LASER_HEAD) {
        await this.endCameraPreview();
      }
    } catch (error) {
      console.log('Failed to end Beamo2PreviewManager', error);
    }
  };

  public preview = async (): Promise<boolean> => {
    if (!this.doorChecker.keepClosed) {
      const res = await this.setUpCamera();

      if (!res) {
        return true;
      }
    }

    try {
      const renewMessage = () =>
        MessageCaller.openMessage({
          content: i18n.lang.topbar.preview,
          duration: 20,
          key: this.progressId,
          level: MessageLevel.LOADING,
        });

      renewMessage();

      try {
        const getExposureRes = await deviceMaster.getCameraExposure();

        if (getExposureRes?.success) this.originalExposure = getExposureRes.data;
      } catch (error) {
        console.error('Failed to get camera exposure', error);
      }

      const takePictures = async (useLowResolution = false) => {
        if (this.originalExposure !== null) {
          try {
            await deviceMaster.setCameraExposure(this.originalExposure + 500);
          } catch (error) {
            console.error('Failed to set exposure setting', error);
          }
        }

        const lightImageUrl = await this.getPhotoFromMachine({ useLowResolution });
        let darkImageUrl;

        if (this.originalExposure !== null) {
          try {
            await deviceMaster.setCameraExposure(this.originalExposure);
          } catch (error) {
            console.error('Failed to set exposure setting', error);
          }

          darkImageUrl = await this.getPhotoFromMachine({ useLowResolution });
        }

        await new Promise<void>((resolve) => PreviewModeBackgroundDrawer.drawFullWorkarea(lightImageUrl, resolve));

        if (darkImageUrl) setMaskImage(darkImageUrl, 'fbm2Camera');
      };

      await takePictures(true);
      renewMessage();
      await takePictures(false);
      this.originalExposure = null;

      MessageCaller.openMessage({
        content: i18n.lang.message.preview.succeeded,
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
