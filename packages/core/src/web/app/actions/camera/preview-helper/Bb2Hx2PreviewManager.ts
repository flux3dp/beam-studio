import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { hexaRfModels, PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import {
  bb2FullAreaPerspectiveGrid,
  hx2FullAreaPerspectiveGrid,
} from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParameters, FisheyeCameraParametersV4 } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import { MessageLevel } from '@core/interfaces/IMessage';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV4 from './FisheyePreviewManagerV4';
import { getWideAngleCameraData } from './getWideAngleCameraData';
import RegionPreviewMixin from './RegionPreviewMixin';

// TODO: Add tests
class Bb2Hx2PreviewManager extends RegionPreviewMixin(BasePreviewManager) implements PreviewManager {
  private lineCheckEnabled: boolean = false;
  private wideAngleFisheyeManager?: FisheyePreviewManagerV4;
  private wideAngleFisheyeParams?: FisheyeCameraParametersV4;
  private fisheyeParams?: FisheyeCameraParameters;
  private fullAreaGrid = bb2FullAreaPerspectiveGrid;
  protected maxMovementSpeed: [number, number] = [54000, 6000]; // mm/min, speed cap of machine

  public hasWideAngleCamera: boolean = false;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'beam-preview-manager';

    if (hexaRfModels.has(device.model)) {
      this.fullAreaGrid = hx2FullAreaPerspectiveGrid;
    }
  }

  get isSwitchable(): boolean {
    return this.hasWideAngleCamera;
  }

  protected getMovementSpeed = (): number => {
    const previewMovementSpeedLevel = useGlobalPreferenceStore.getState()['preview_movement_speed_level'];

    return match(previewMovementSpeedLevel)
      .with(PreviewSpeedLevel.FAST, () => 42000)
      .with(PreviewSpeedLevel.MEDIUM, () => 36000)
      .with(PreviewSpeedLevel.SLOW, () => 30000)
      .otherwise(() => 30000);
  };

  private handleSetupError = async (error: unknown): Promise<void> => {
    const { lang } = i18n;

    await this.end();
    console.log('Error when setting up Bb2Hx2 Preview Manager', error);

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

  switchPreviewMode = async (mode: PreviewMode): Promise<PreviewMode> => {
    if (this._previewMode === mode) return this._previewMode;

    const { lang } = i18n;

    if (mode === PreviewMode.FULL_AREA && !this.wideAngleFisheyeParams) {
      alertCaller.popUpError({ message: lang.message.camera.calibration_wide_angle_camera_first });

      return this._previewMode;
    }

    try {
      this.showMessage({ content: lang.message.camera.switching_camera });

      if (this._previewMode === PreviewMode.REGION) {
        await this.endLaserHeadCameraPreview(false);
      }

      if (mode === PreviewMode.REGION) {
        await this.setupLaserHeadCamera();
      } else {
        await this.setupWideAngleCamera();
      }

      this._previewMode = mode;

      return this._previewMode;
    } finally {
      this.closeMessage();
    }
  };

  private setupWideAngleCamera = async (): Promise<boolean> => {
    const { lang } = i18n;

    try {
      if (!(await deviceMaster.setCamera(1))) {
        throw new Error('tUnable to connect to wide angle camera.');
      }

      if (!this.wideAngleFisheyeParams) {
        throw new Error(
          'Unable to get wide angle fisheye parameters, please make sure you have calibrated the wide angle camera',
        );
      }

      console.log('wide angle params', this.wideAngleFisheyeParams);
      this.wideAngleFisheyeManager = new FisheyePreviewManagerV4(
        this.device,
        this.wideAngleFisheyeParams,
        this.fullAreaGrid,
      );

      const res = await this.wideAngleFisheyeManager.setupFisheyePreview({
        closeMessage: () => this.closeMessage(),
        updateMessage: (message: string) => this.showMessage({ content: message }),
      });

      return res;
    } catch (error) {
      this.handleSetupError(error);

      return false;
    } finally {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();
        this.showMessage({ content: lang.message.endingRawMode });
        await deviceMaster.endSubTask();
      }
    }
  };

  private setupLaserHeadCamera = async (): Promise<boolean> => {
    const { lang } = i18n;

    try {
      await deviceMaster.setCamera(0);
    } catch (err) {
      console.error('Fail to setCamera to laser head', err);
    }

    try {
      if (!this.fisheyeParams) {
        try {
          this.fisheyeParams = await deviceMaster.fetchFisheyeParams();
        } catch (err) {
          console.log('Fail to fetchFisheyeParams', err);
          throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
        }
      }

      this.showMessage({ content: lang.message.enteringRawMode });
      await deviceMaster.enterRawMode();
      this.showMessage({ content: lang.message.exitingRotaryMode });
      await deviceMaster.rawSetRotary(false);
      this.showMessage({ content: lang.message.homing });
      await deviceMaster.rawHome();
      await deviceMaster.rawStartLineCheckMode();
      this.lineCheckEnabled = true;
      this.showMessage({ content: lang.message.turningOffFan });
      await deviceMaster.rawSetFan(false);
      this.showMessage({ content: lang.message.turningOffAirPump });
      await deviceMaster.rawSetAirPump(false);
      await deviceMaster.rawSetWaterPump(false);
      this.showMessage({ content: lang.message.connectingCamera });

      if (!(await deviceMaster.setFisheyeParam(this.fisheyeParams!))) {
        throw new Error('Failed to set fisheye parameters');
      }

      if (!(await deviceMaster.setFisheyePerspectiveGrid(this.regionPreviewGrid))) {
        throw new Error('Failed to set fisheye perspective grid');
      }

      return true;
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    }
  };

  public setup = async ({ progressId }: { progressId?: string } = {}): Promise<boolean> => {
    if (progressId) this.progressId = progressId;

    const { lang } = i18n;

    try {
      this.showMessage({ content: sprintf(lang.message.connectingMachine, this.device.name) });

      await deviceMaster.connectCamera();

      const { canPreview, hasWideAngleCamera, parameters } = await getWideAngleCameraData(this.device);

      this.hasWideAngleCamera = hasWideAngleCamera;
      this.wideAngleFisheyeParams = parameters as FisheyeCameraParametersV4 | undefined;

      this._previewMode = canPreview && this.hasWideAngleCamera ? PreviewMode.FULL_AREA : PreviewMode.REGION;

      const res = await match(this._previewMode)
        .with(PreviewMode.FULL_AREA, () => this.setupWideAngleCamera())
        .otherwise(() => this.setupLaserHeadCamera());

      return res;
    } catch (error) {
      await this.handleSetupError(error);

      return false;
    } finally {
      this.closeMessage();
    }
  };

  end = async (): Promise<void> => {
    this.ended = true;
    this.closeMessage();

    try {
      if (this._previewMode === PreviewMode.REGION) {
        await this.endLaserHeadCameraPreview();
      }
    } catch (error) {
      console.log('Failed to end BeamPreviewManager', error);
    }
  };

  public preview = (x: number, y: number, opts?: { overlapFlag?: number; overlapRatio?: number }): Promise<boolean> => {
    return match(this._previewMode)
      .with(PreviewMode.FULL_AREA, () => this.previewWithWideAngleCamera())
      .otherwise(() => this.regionPreviewAtPoint(x, y, opts));
  };

  public previewRegion = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { overlapRatio?: number },
  ): Promise<boolean> => {
    return match(this._previewMode)
      .with(PreviewMode.FULL_AREA, () => this.previewWithWideAngleCamera())
      .otherwise(() => this.regionPreviewArea(x1, y1, x2, y2, opts));
  };

  public previewFullWorkarea = (): Promise<boolean> => {
    return match(this._previewMode)
      .with(PreviewMode.FULL_AREA, () => this.previewWithWideAngleCamera())
      .otherwise(() => Promise.resolve(false));
  };

  // Methods of Laser Head Camera Preview
  private endLaserHeadCameraPreview = async (disconnectCamera: boolean = true): Promise<void> => {
    const res = await deviceMaster.select(this.device);

    if (res.success) {
      if (disconnectCamera) deviceMaster.disconnectCamera();

      if (deviceMaster.currentControlMode !== 'raw') await deviceMaster.enterRawMode();

      if (this.lineCheckEnabled) await deviceMaster.rawEndLineCheckMode();

      this.lineCheckEnabled = false;

      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();

      deviceMaster.kick();
    }
  };
  // End of Laser Head Camera Preview

  // Methods of Wide Angle Camera Preview
  previewWithWideAngleCamera = async (): Promise<boolean> => {
    try {
      this.showMessage({ content: i18n.lang.message.preview.capturing_image });

      const imgUrl = await this.getPhotoFromMachine();

      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      this.showMessage({ content: i18n.lang.message.preview.succeeded, duration: 3, level: MessageLevel.SUCCESS });

      return true;
    } catch (error) {
      this.closeMessage();
      throw error;
    }
  };

  reloadLevelingOffset = async (): Promise<void> => {};

  resetObjectHeight = async (): Promise<boolean> => {
    if (this._previewMode === PreviewMode.FULL_AREA && this.wideAngleFisheyeManager) {
      return this.wideAngleFisheyeManager.resetObjectHeight();
    }

    return false;
  };
  // End of Wide Angle Camera Preview
}

export default Bb2Hx2PreviewManager;
