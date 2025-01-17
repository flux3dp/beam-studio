import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import deviceMaster from 'helpers/device-master';
import ErrorConstants from 'app/constants/error-constants';
import i18n from 'helpers/i18n';
import MessageCaller from 'app/actions/message-caller';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import progressCaller from 'app/actions/progress-caller';
import versionChecker from 'helpers/version-checker';
import { CameraConfig, CameraParameters } from 'interfaces/Camera';
import { getSupportInfo } from 'app/constants/add-on';
import { IDeviceInfo } from 'interfaces/IDevice';
import { PreviewManager } from 'interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';

// TODO: Add tests
class BeamPreviewManager extends BasePreviewManager implements PreviewManager {
  cameraOffset: CameraParameters;

  private lineCheckEnabled: boolean;

  private originalSpeed: number;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'beam-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};
    if (progressId) this.progressId = progressId;
    try {
      progressCaller.openNonstopProgress({
        id: this.progressId,
        message: sprintf(lang.message.connectingMachine, this.device.name),
      });
      await this.retrieveCameraOffset();
      progressCaller.update(this.progressId, { message: lang.message.gettingLaserSpeed });
      const laserSpeed = await deviceMaster.getLaserSpeed();
      if (Number(laserSpeed.value) !== 1) {
        this.originalSpeed = Number(laserSpeed.value);
        progressCaller.update(this.progressId, {
          message: lang.message.settingLaserSpeed,
        });
        await deviceMaster.setLaserSpeed(1);
      }
      progressCaller.update(this.progressId, { message: lang.message.enteringRawMode });
      await deviceMaster.enterRawMode();
      progressCaller.update(this.progressId, { message: lang.message.exitingRotaryMode });
      await deviceMaster.rawSetRotary(false);
      progressCaller.update(this.progressId, { message: lang.message.homing });
      await deviceMaster.rawHome();
      const vc = versionChecker(this.device.version);
      if (vc.meetRequirement('MAINTAIN_WITH_LINECHECK')) {
        await deviceMaster.rawStartLineCheckMode();
        this.lineCheckEnabled = true;
      } else {
        this.lineCheckEnabled = false;
      }
      progressCaller.update(this.progressId, { message: lang.message.turningOffFan });
      await deviceMaster.rawSetFan(false);
      progressCaller.update(this.progressId, { message: lang.message.turningOffAirPump });
      await deviceMaster.rawSetAirPump(false);
      await deviceMaster.rawSetWaterPump(false);
      progressCaller.update(this.progressId, { message: lang.message.connectingCamera });
      await deviceMaster.connectCamera();
      return true;
    } catch (error) {
      await this.end();
      console.log('Error in setup', error);
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
      progressCaller.popById(this.progressId);
    }
  };

  end = async (): Promise<void> => {
    this.ended = true;
    MessageCaller.closeMessage('camera-preview');
    try {
      const res = await deviceMaster.select(this.device);
      if (res.success) {
        deviceMaster.disconnectCamera();
        if (deviceMaster.currentControlMode !== 'raw') await deviceMaster.enterRawMode();
        if (this.lineCheckEnabled) await deviceMaster.rawEndLineCheckMode();
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endRawMode();
        if (this.originalSpeed && this.originalSpeed !== 1) {
          await deviceMaster.setLaserSpeed(this.originalSpeed);
          this.originalSpeed = 1;
        }
        deviceMaster.kick();
      }
    } catch (error) {
      console.log('Failed to end BeamPreviewManager', error);
    }
  };

  private retrieveCameraOffset = async () => {
    const { lang } = i18n;
    // End linecheck mode if needed
    try {
      if (this.lineCheckEnabled) {
        progressCaller.update(this.progressId, {
          message: lang.message.endingLineCheckMode,
        });
        await deviceMaster.rawEndLineCheckMode();
      }
    } catch (error) {
      if (error.message === ErrorConstants.CONTROL_SOCKET_MODE_ERROR) {
        // Device control is not in raw mode
      } else if (
        error.status === 'error' &&
        error.error &&
        error.error[0] === 'L_UNKNOWN_COMMAND'
      ) {
        // Ghost control socket is not in raw mode, unknown command M172
      } else console.log('Unable to end line check mode', error);
    }
    // cannot getDeviceSetting during RawMode. So we force to end it.
    try {
      progressCaller.update(this.progressId, { message: lang.message.endingRawMode });
      await deviceMaster.endRawMode();
    } catch (error) {
      if (error.status === 'error' && error.error && error.error[0] === 'OPERATION_ERROR') {
        console.log('Not in raw mode right now');
      } else if (error.status === 'error' && error.error === 'TIMEOUT') {
        console.log('Timeout has occur when end raw mode, reconnecting');
        await deviceMaster.reconnect();
      } else console.log(error);
    }

    const borderless = beamboxPreference.read('borderless') || false;
    const supportOpenBottom = getSupportInfo(this.workarea).openBottom;
    const configName =
      supportOpenBottom && borderless ? 'camera_offset_borderless' : 'camera_offset';

    progressCaller.update(this.progressId, { message: lang.message.retrievingCameraOffset });
    const resp = await deviceMaster.getDeviceSetting(configName);
    console.log(`Reading ${configName}\nResp = ${resp.value}`);
    resp.value = ` ${resp.value}`;
    this.cameraOffset = {
      x: Number(/ X:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
      y: Number(/ Y:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
      angle: Number(/R:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
      scaleRatioX: Number(
        (/SX:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))[1]
      ),
      scaleRatioY: Number(
        (/SY:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))[1]
      ),
    };
    if (this.cameraOffset.x === 0 && this.cameraOffset.y === 0) {
      this.cameraOffset = {
        x: constant.camera.offsetX_ideal,
        y: constant.camera.offsetY_ideal,
        angle: 0,
        scaleRatioX: constant.camera.scaleRatio_ideal,
        scaleRatioY: constant.camera.scaleRatio_ideal,
      };
    }
    console.log(`Got ${configName}`, this.cameraOffset);
  };

  getCameraOffset = (): CameraParameters => this.cameraOffset;

  getCameraOffsetStandard = (): CameraConfig => ({
    X: this.cameraOffset.x,
    Y: this.cameraOffset.y,
    R: this.cameraOffset.angle,
    SX: this.cameraOffset.scaleRatioX,
    SY: this.cameraOffset.scaleRatioY,
  });

  constrainPreviewXY = (x: number, y: number): { x: number; y: number } => {
    const { pxWidth: width, pxHeight, pxDisplayHeight } = this.workareaObj;
    const height = pxDisplayHeight ?? pxHeight;
    const supportInfo = getSupportInfo(this.workarea);
    const isDiodeEnabled = beamboxPreference.read('enable-diode') && supportInfo.hybridLaser;
    const isBorderlessEnabled = beamboxPreference.read('borderless') && supportInfo.openBottom;
    let maxWidth = width;
    let maxHeight = height;
    if (isDiodeEnabled) {
      maxWidth -= constant.diode.safeDistance.X * constant.dpmm;
      maxHeight -= constant.diode.safeDistance.Y * constant.dpmm;
    } else if (isBorderlessEnabled) {
      maxWidth -= constant.borderless.safeDistance.X * constant.dpmm;
    }
    const newX = Math.min(Math.max(x, this.cameraOffset.x * constant.dpmm), maxWidth);
    const newY = Math.min(Math.max(y, this.cameraOffset.y * constant.dpmm), maxHeight);
    return { x: newX, y: newY };
  };

  getPhotoAfterMove = (x: number, y: number): Promise<string> => {
    const movementX = x / constant.dpmm - this.cameraOffset.x;
    const movementY = y / constant.dpmm - this.cameraOffset.y;
    return this.getPhotoAfterMoveTo(movementX, movementY);
  };

  preprocessImage = async (
    imgUrl: string,
    opts: { overlapRatio?: number; overlapFlag?: number } = {}
  ): Promise<HTMLCanvasElement> => {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imgUrl;
    });
    const { overlapRatio = 0, overlapFlag = 0 } = opts;
    const { angle, scaleRatioX, scaleRatioY } = this.cameraOffset;
    const a = angle;
    const w = img.width;
    const h = img.height;
    const l = Math.round((h * scaleRatioY) / (Math.cos(a) + Math.sin(a)));
    const canvas = document.createElement('canvas');
    canvas.width = l;
    canvas.height = l;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.translate(l / 2, l / 2);
    ctx.rotate(a);
    ctx.scale(scaleRatioX, scaleRatioY);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    const overlapWidth = Math.round(overlapRatio * l);
    if (overlapWidth > 0) {
      const imageData = ctx.getImageData(0, 0, l, l);
      for (let x = 0; x < l; x += 1) {
        for (let y = 0; y < l; y += 1) {
          // eslint-disable-next-line no-bitwise
          const tDist = overlapFlag & 1 ? y : overlapWidth;
          // eslint-disable-next-line no-bitwise
          const rDist = overlapFlag & 2 ? l - x - 1 : overlapWidth;
          // eslint-disable-next-line no-bitwise
          const bDist = overlapFlag & 4 ? l - y - 1 : overlapWidth;
          // eslint-disable-next-line no-bitwise
          const lDist = overlapFlag & 8 ? x : overlapWidth;
          const xDist = Math.min((Math.min(lDist, rDist) + 1) / overlapWidth, 1);
          const yDist = Math.min((Math.min(tDist, bDist) + 1) / overlapWidth, 1);
          let alphaRatio = xDist * yDist;
          if (alphaRatio < 1) {
            alphaRatio **= 1;
            const i = (y * l + x) * 4;
            imageData.data[i + 3] = Math.round(imageData.data[i + 3] * alphaRatio);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
  };

  preview = async (
    x: number,
    y: number,
    opts: { overlapRatio?: number; overlapFlag?: number } = {}
  ): Promise<boolean> => {
    if (this.ended) return false;
    const { overlapRatio = 0, overlapFlag } = opts;
    const constrainedXY = this.constrainPreviewXY(x, y);
    const { x: newX, y: newY } = constrainedXY;
    const imgUrl = await this.getPhotoAfterMove(newX, newY);
    const imgCanvas = await this.preprocessImage(imgUrl, { overlapRatio, overlapFlag });
    // await this if you want wait for the image to be drawn
    await PreviewModeBackgroundDrawer.drawImageToCanvas(imgCanvas, newX, newY, {
      opacityMerge: overlapRatio > 0,
    });
    return true;
  };

  previewRegion = async (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    { overlapRatio = 0.05 }: { overlapRatio?: number } = {}
  ): Promise<boolean> => {
    const getPoints = () => {
      const size = (() => {
        const h = constant.camera.imgHeight;
        const a = this.cameraOffset.angle;
        const s = this.cameraOffset.scaleRatioY;
        const c = h / (Math.cos(a) + Math.sin(a));
        // overlap a little bit to fix empty area between pictures
        // (some machine will have it, maybe due to cameraOffset.angle).
        // it seems like something wrong handling image rotation.
        return c * s;
      })();
      const { left, right, top, bottom } = (() => {
        const l = Math.min(x1, x2) + size / 2;
        const r = Math.max(x1, x2) - size / 2;
        const t = Math.min(y1, y2) + size / 2;
        const b = Math.max(y1, y2) - size / 2;

        return {
          left: this.constrainPreviewXY(l, 0).x,
          right: this.constrainPreviewXY(r, 0).x,
          top: this.constrainPreviewXY(0, t).y,
          bottom: this.constrainPreviewXY(0, b).y,
        };
      })();

      let pointsArray: { point: [number, number]; overlapFlag: number }[] = [];
      let shouldRowReverse = false; // let camera 走Ｓ字型
      const step = (1 - overlapRatio) * size;

      for (let curY = top; curY < bottom + size; curY += step) {
        const row: { point: [number, number]; overlapFlag: number }[] = [];

        for (let curX = left; curX < right + size; curX += step) {
          let overlapFlag = 0;
          // 1: top, 2: right, 4: bottom, 8: left
          if (curY !== top) overlapFlag += 1;
          if (curX + step < right + size) overlapFlag += 2;
          if (curY + step < bottom + size) overlapFlag += 4;
          if (curX !== left) overlapFlag += 8;
          row.push({ point: [curX, curY], overlapFlag });
        }

        if (shouldRowReverse) {
          row.reverse();
        }

        pointsArray = pointsArray.concat(row);
        shouldRowReverse = !shouldRowReverse;
      }

      return pointsArray;
    };

    return this.previewRegionFromPoints(x1, y1, x2, y2, { getPoints, overlapRatio });
  };
}

export default BeamPreviewManager;
