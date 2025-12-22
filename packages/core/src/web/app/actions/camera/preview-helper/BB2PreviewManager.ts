import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { hexaRfModels, PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import {
  bb2PerspectiveGrid,
  bb2WideAnglePerspectiveGrid,
  hx2rfPerspectiveGrid,
} from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { CameraType } from '@core/app/constants/cameraConstants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
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

// TODO: Add tests
class BB2PreviewManager extends BasePreviewManager implements PreviewManager {
  private cameraType: CameraType = CameraType.LASER_HEAD;
  private lineCheckEnabled: boolean = false;
  private wideAngleFisheyeManager?: FisheyePreviewManagerV4;
  private wideAngleFisheyeParams?: FisheyeCameraParametersV4;
  private fisheyeParams?: FisheyeCameraParameters;
  private cameraPpmm = 5;
  private previewPpmm = 10;
  private grid = bb2PerspectiveGrid;
  private wideAngleGrid = bb2WideAnglePerspectiveGrid;
  private cameraCenterOffset: { x: number; y: number };
  protected maxMovementSpeed: [number, number] = [54000, 6000]; // mm/min, speed cap of machine

  public hasWideAngleCamera: boolean = false;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'beam-preview-manager';

    if (hexaRfModels.has(device.model)) this.grid = hx2rfPerspectiveGrid;

    this.cameraCenterOffset = {
      x: this.grid.x[0] + (this.grid.x[1] - this.grid.x[0]) / 2,
      y: this.grid.y[0] + (this.grid.y[1] - this.grid.y[0]) / 2,
    };
  }

  get isFullScreen(): boolean {
    return this.cameraType === CameraType.WIDE_ANGLE;
  }

  get isWideAngleCameraCalibrated(): boolean {
    return !!this.wideAngleFisheyeParams;
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
    console.log('Error when setting up BB2 Preview Manager', error);

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

  switchCamera = async (cameraType: CameraType): Promise<CameraType> => {
    if (this.cameraType === cameraType) return this.cameraType;

    try {
      this.showMessage({ content: 'tSwitching camera' });

      if (this.cameraType === CameraType.LASER_HEAD) {
        await this.endLaserHeadCameraPreview(false);
      }

      if (cameraType === CameraType.LASER_HEAD) {
        await deviceMaster.setCamera(0);
        await this.setupLaserHeadCamera();
      } else {
        await this.setupWideAngleCamera();
      }

      this.cameraType = cameraType;

      return this.cameraType;
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
        this.wideAngleGrid,
      );

      const res = await this.wideAngleFisheyeManager.setupFisheyePreview({
        messageType: 'message',
        progressId: this.progressId,
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

      if (!(await deviceMaster.setFisheyePerspectiveGrid(this.grid))) {
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

      const { hasWideAngleCamera, parameters } = await getWideAngleCameraData(this.device);

      this.hasWideAngleCamera = hasWideAngleCamera;
      this.wideAngleFisheyeParams = parameters as FisheyeCameraParametersV4 | undefined;
      this.cameraType =
        this.hasWideAngleCamera && this.wideAngleFisheyeParams ? CameraType.WIDE_ANGLE : CameraType.LASER_HEAD;

      const res = await match<CameraType>(this.cameraType)
        .with(CameraType.WIDE_ANGLE, () => this.setupWideAngleCamera())
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
      if (this.cameraType === CameraType.LASER_HEAD) {
        await this.endLaserHeadCameraPreview();
      }
    } catch (error) {
      console.log('Failed to end BeamPreviewManager', error);
    }
  };

  public preview = (x: number, y: number, opts?: { overlapFlag?: number; overlapRatio?: number }): Promise<boolean> => {
    return match(this.cameraType)
      .with(CameraType.WIDE_ANGLE, () => this.previewWithWideAngleCamera())
      .otherwise(() => this.previewWithLaserHeadCamera(x, y, opts));
  };

  public previewRegion = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { overlapRatio?: number },
  ): Promise<boolean> => {
    return match(this.cameraType)
      .with(CameraType.WIDE_ANGLE, () => this.previewWithWideAngleCamera())
      .otherwise(() => this.previewRegionWithLaserHeadCamera(x1, y1, x2, y2, opts));
  };

  public previewFullWorkarea = (): Promise<boolean> => {
    return match(this.cameraType)
      .with(CameraType.WIDE_ANGLE, () => this.previewWithWideAngleCamera())
      .otherwise(() => Promise.resolve(false));
  };

  // Methods of Laser Head Camera Preview
  /**
   * getPreviewPosition
   * @param x x in px
   * @param y y in px
   * @returns preview camera position x, y in mm
   */
  getPreviewPosition = (x: number, y: number): { x: number; y: number } => {
    let newX = x / constant.dpmm - this.cameraCenterOffset.x;
    let newY = y / constant.dpmm - this.cameraCenterOffset.y;
    const { displayHeight, height: origH, width } = getWorkarea(this.workarea);
    const height = displayHeight ?? origH;

    newX = Math.min(Math.max(newX, -this.grid.x[0]), width - this.grid.x[1]);
    newY = Math.min(Math.max(newY, -this.grid.y[0]), height - this.grid.y[1]);

    return { x: newX, y: newY };
  };

  preprocessLaserHeadCameraImage = async (
    imgUrl: string,
    opts: { overlapFlag?: number; overlapRatio?: number } = {},
  ): Promise<HTMLCanvasElement> => {
    const { overlapFlag = 0, overlapRatio = 0 } = opts;
    const img = new Image();

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = imgUrl;
    });

    const canvas = document.createElement('canvas');
    const ratio = this.previewPpmm / this.cameraPpmm;

    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.scale(ratio, ratio);
    ctx.drawImage(img, 0, 0);

    const { height, width } = canvas;
    const overlapWidth = Math.round(width * overlapRatio);
    const overlapHeight = Math.round(height * overlapRatio);

    if (overlapWidth > 0 || overlapHeight > 0) {
      const imageData = ctx.getImageData(0, 0, width, height);

      for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
          const tDist = overlapFlag & 1 ? y : overlapHeight;

          const rDist = overlapFlag & 2 ? width - x - 1 : overlapWidth;

          const bDist = overlapFlag & 4 ? height - y - 1 : overlapHeight;

          const lDist = overlapFlag & 8 ? x : overlapWidth;
          const xDist = overlapWidth ? Math.min((Math.min(lDist, rDist) + 1) / overlapWidth, 1) : 1;
          const yDist = overlapHeight ? Math.min((Math.min(tDist, bDist) + 1) / overlapHeight, 1) : 1;
          let alphaRatio = xDist * yDist;

          if (alphaRatio < 1) {
            alphaRatio **= 1;

            const i = (y * width + x) * 4;

            imageData.data[i + 3] = Math.round(imageData.data[i + 3] * alphaRatio);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    return canvas;
  };

  previewWithLaserHeadCamera = async (
    x: number,
    y: number,
    opts: { overlapFlag?: number; overlapRatio?: number } = {},
  ): Promise<boolean> => {
    if (this.ended) return false;

    const { overlapFlag, overlapRatio = 0 } = opts;
    const cameraPosition = this.getPreviewPosition(x, y);
    const imgUrl = await this.getPhotoAfterMoveTo(cameraPosition.x, cameraPosition.y);
    const imgCanvas = await this.preprocessLaserHeadCameraImage(imgUrl, { overlapFlag, overlapRatio });
    const drawCenter = {
      x: (cameraPosition.x + this.cameraCenterOffset.x) * constant.dpmm,
      y: (cameraPosition.y + this.cameraCenterOffset.y) * constant.dpmm,
    };

    await PreviewModeBackgroundDrawer.drawImageToCanvas(imgCanvas, drawCenter.x, drawCenter.y, {
      opacityMerge: overlapRatio > 0,
    });

    return true;
  };

  previewRegionWithLaserHeadCamera = async (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    { overlapRatio = 0.05 }: { overlapRatio?: number } = {},
  ): Promise<boolean> => {
    const getPoints = () => {
      const imgW = (this.grid.x[1] - this.grid.x[0]) * constant.dpmm;
      const imgH = (this.grid.y[1] - this.grid.y[0]) * constant.dpmm;
      const { x: l, y: t } = this.constrainPreviewXY(Math.min(x1, x2), Math.min(y1, y2));
      const { x: r, y: b } = this.constrainPreviewXY(Math.max(x1, x2), Math.max(y1, y2));

      const res: Array<{ overlapFlag: number; point: [number, number] }> = [];
      const xStep = imgW * (1 - overlapRatio);
      const yStep = imgH * (1 - overlapRatio);
      const xTotal = Math.max(1, Math.ceil((r - l) / xStep));
      const yTotal = Math.max(1, Math.ceil((b - t) / yStep));

      for (let j = 0; j < yTotal; j += 1) {
        const y = t + imgH / 2 + j * yStep;
        const row: Array<{ overlapFlag: number; point: [number, number] }> = [];

        for (let i = 0; i < xTotal; i += 1) {
          const x = l + imgW / 2 + i * xStep;
          let overlapFlag = 0;

          // 1: top, 2: right, 4: bottom, 8: left
          if (j !== 0) overlapFlag += 1;

          if (i !== xTotal - 1) overlapFlag += 2;

          if (j !== yTotal - 1) overlapFlag += 4;

          if (i !== 0) overlapFlag += 8;

          row.push({ overlapFlag, point: [x, y] });
        }

        if (j % 2 !== 0) row.reverse();

        res.push(...row);
      }

      return res;
    };

    return this.previewRegionFromPoints(x1, y1, x2, y2, { getPoints, overlapRatio });
  };

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
    if (this.cameraType === CameraType.WIDE_ANGLE && this.wideAngleFisheyeManager) {
      return this.wideAngleFisheyeManager.resetObjectHeight();
    }

    return false;
  };
  // End of Wide Angle Camera Preview

  getCameraType = (): CameraType => this.cameraType;
}

export default BB2PreviewManager;
