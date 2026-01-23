import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import DoorChecker from '@core/app/actions/camera/preview-helper/DoorChecker';
import { bm2FullAreaPerspectiveGrid } from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { clearBackgroundImage, setMaskImage } from '@core/app/svgedit/canvasBackground';
import { setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV4, PerspectiveGrid } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import { MessageLevel } from '@core/interfaces/IMessage';
import { ProgressTypes } from '@core/interfaces/IProgress';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';
import FisheyePreviewManagerV4 from './FisheyePreviewManagerV4';
import RegionPreviewMixin from './RegionPreviewMixin';

class Beamo2PreviewManager extends RegionPreviewMixin(BasePreviewManager) implements PreviewManager {
  private lineCheckEnabled: boolean = false;
  private fisheyeParams?: FisheyeCameraParametersV4;
  private fisheyePreviewManager?: FisheyePreviewManagerV4;
  private fullAreaGrid = bm2FullAreaPerspectiveGrid;
  private doorChecker = new DoorChecker();
  private originalExposure: null | number = null;
  protected maxMovementSpeed: [number, number] = [45000, 6000]; // mm/min, speed cap of machine
  protected progressType = ProgressTypes.STEPPING;
  protected _isSwitchable = true;
  protected _previewMode = PreviewMode.FULL_AREA;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'beamo2-preview-manager';
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
      if (!this.fisheyeParams) {
        try {
          this.fisheyeParams = (await deviceMaster.fetchFisheyeParams()) as FisheyeCameraParametersV4;
        } catch (err) {
          console.log('Fail to fetchFisheyeParams', err);
          throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
        }
      }

      this.fisheyePreviewManager =
        this.fisheyePreviewManager ?? new FisheyePreviewManagerV4(this.device, this.fisheyeParams, this.fullAreaGrid);

      const workarea = getWorkarea(this.device.model, 'fbm2');
      const { cameraCenter } = workarea;

      return await this.doorChecker.doorClosedWrapper(() =>
        this.fisheyePreviewManager!.setupFisheyePreview({
          cameraPosition: cameraCenter,
          closeMessage: () => this.closeMessage(),
          height: 0,
          movementFeedrate: this.getMovementSpeed(),
          shouldKeepInRawMode: true,
          updateMessage: (message: string) => this.showMessage({ content: message }),
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
      this.showMessage({ content: sprintf(lang.message.connectingMachine, this.device.name) });

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
        const workarea = getWorkarea(this.device.model, 'fbm2');
        const { cameraRestPosition } = workarea;

        if (cameraRestPosition) {
          await deviceMaster.rawMove({
            f: this.getMovementSpeed(),
            x: cameraRestPosition[0],
            y: cameraRestPosition[1],
          });
        }

        await deviceMaster.rawLooseMotor();

        if (this.lineCheckEnabled) await deviceMaster.rawEndLineCheckMode();

        this.showMessage({ content: i18n.lang.message.endingRawMode });
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
    this.closeMessage();

    try {
      await this.endCameraPreview();
    } catch (error) {
      console.log('Failed to end Beamo2PreviewManager', error);
    }
  };

  public preview = async (
    x: number,
    y: number,
    opts?: { overlapFlag?: number; overlapRatio?: number },
  ): Promise<boolean> => {
    return match(this._previewMode)
      .with(PreviewMode.FULL_AREA, () => this.previewFullWorkarea())
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
      .with(PreviewMode.FULL_AREA, () => this.previewFullWorkarea())
      .otherwise(() => this.regionPreviewArea(x1, y1, x2, y2, opts));
  };

  public previewFullWorkarea = async (): Promise<boolean> => {
    if (!this.doorChecker.keepClosed) {
      const res = await this.setUpCamera();

      if (!res) {
        return true;
      }
    }

    try {
      this.showMessage({ content: i18n.lang.message.preview.capturing_image });

      let originalAutoExposure: boolean | null = null;

      try {
        const res = await deviceMaster.getCameraExposureAuto();

        if (res?.success) originalAutoExposure = res.data;
      } catch (error) {
        console.error('Failed to get camera exposure auto', error);
      }

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

        if (originalAutoExposure !== null) {
          try {
            await deviceMaster.setCameraExposureAuto(originalAutoExposure);
          } catch (error) {
            console.error('Failed to reset auto exposure setting', error);
          }
        }

        await new Promise<void>((resolve) => PreviewModeBackgroundDrawer.drawFullWorkarea(lightImageUrl, resolve));

        if (darkImageUrl) setMaskImage(darkImageUrl, 'fbm2Camera');
      };

      await takePictures(true);
      this.showMessage({ content: i18n.lang.message.preview.capturing_image });
      await takePictures(false);
      this.originalExposure = null;

      this.showMessage({ content: i18n.lang.message.preview.succeeded, duration: 3, level: MessageLevel.SUCCESS });

      return true;
    } catch (error) {
      this.closeMessage();
      throw error;
    }
  };

  switchPreviewMode = async (mode: PreviewMode) => {
    if (this._previewMode === mode) return this._previewMode;

    this.showMessage({ content: i18n.lang.message.camera.switching_camera });

    const cameraCenter = getWorkarea(this.device.model, 'fbm2').cameraCenter!;
    const grid = match<PreviewMode, PerspectiveGrid>(mode)
      .with(PreviewMode.REGION, () => ({
        // offset grid for camera websocket because it is calibrated at camera center
        x: [
          this.regionPreviewGrid.x[0] + cameraCenter[0],
          this.regionPreviewGrid.x[1] + cameraCenter[0],
          this.regionPreviewGrid.x[2],
        ],
        y: [
          this.regionPreviewGrid.y[0] + cameraCenter[1],
          this.regionPreviewGrid.y[1] + cameraCenter[1],
          this.regionPreviewGrid.y[2],
        ],
      }))
      .otherwise(() => this.fullAreaGrid);

    // merge background image and mask image before exiting full screen preview mode
    if (this._previewMode === PreviewMode.FULL_AREA && !previewModeBackgroundDrawer.isClean()) {
      // not using cache to avoid image url revoked when clearBackgroundImage
      const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });

      clearBackgroundImage();
      previewModeBackgroundDrawer.setCanvasUrl(url);
    }

    if (mode === PreviewMode.FULL_AREA) {
      await this.moveTo(cameraCenter[0], cameraCenter[1]);
    }

    try {
      await this.fisheyePreviewManager?.updateGrid(grid);
      this._previewMode = mode;
    } finally {
      this.closeMessage();
    }

    return this._previewMode;
  };
}

export default Beamo2PreviewManager;
