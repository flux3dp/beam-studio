import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import Constant, { promarkModels } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import checkDeviceStatus from '@core/helpers/check-device-status';
import checkOldFirmware from '@core/helpers/device/checkOldFirmware';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import VersionChecker from '@core/helpers/version-checker';
import type { CameraConfig, CameraParameters } from '@core/interfaces/Camera';
import type { RotationParameters3DCalibration } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import AdorPreviewManager from '../camera/preview-helper/AdorPreviewManager';
import BB2PreviewManager from '../camera/preview-helper/BB2PreviewManager';
import BeamPreviewManager from '../camera/preview-helper/BeamPreviewManager';
import PromarkPreviewManager from '../camera/preview-helper/PromarkPreviewManager';

const LANG = i18n.lang;
const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

class PreviewModeController {
  isDrawing: boolean;

  currentDevice: IDeviceInfo;

  isStarting: boolean;

  isPreviewModeOn: boolean;

  isPreviewBlocked: boolean;

  previewManager: PreviewManager;

  liveModeTimeOut: NodeJS.Timeout;

  // is this used?
  errorCallback: () => void;

  camera3dRotaion: RotationParameters3DCalibration;

  constructor() {
    this.isDrawing = false;
    this.currentDevice = null;
    this.isPreviewModeOn = false;
    this.isPreviewBlocked = false;
    this.errorCallback = () => {};
  }

  get isFullScreen() {
    return this.previewManager?.isFullScreen;
  }

  reloadHeightOffset = async () => {
    this.previewManager?.reloadLevelingOffset?.();
  };

  resetFishEyeObjectHeight = async () => {
    const res = (await this.previewManager?.resetObjectHeight?.()) ?? false;

    if (res && !PreviewModeBackgroundDrawer.isClean()) {
      await this.previewFullWorkarea();
    }
  };

  async checkDevice(device: IDeviceInfo | null) {
    if (this.isStarting) {
      return false;
    }

    if (this.currentDevice && this.currentDevice.serial !== device?.serial) {
      await this.end();
      PreviewModeBackgroundDrawer.clear();
    }

    if (!device) {
      return false;
    }

    const deviceStatus = await checkDeviceStatus(device);

    if (!deviceStatus) {
      return false;
    }

    const vc = VersionChecker(device.version);

    if (!vc.meetRequirement('USABLE_VERSION')) {
      Alert.popUp({
        message: LANG.beambox.popup.should_update_firmware_to_continue,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
      Progress.popById('start-preview-controller');

      return false;
    }

    if (BeamboxPreference.read('borderless') && !vc.meetRequirement('BORDERLESS_MODE')) {
      const message = `#814 ${LANG.calibration.update_firmware_msg1} 2.5.1 ${LANG.calibration.update_firmware_msg2} ${LANG.beambox.popup.or_turn_off_borderless_mode}`;
      const caption = LANG.beambox.left_panel.borderless_preview;

      Alert.popUp({
        caption,
        message,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
      Progress.popById('start-preview-controller');

      return false;
    }

    const res = await checkOldFirmware(device.version);

    if (!res) {
      return false;
    }

    return true;
  }

  async start(device: IDeviceInfo, errCallback) {
    this.reset();
    this.isStarting = true;

    const res = await deviceMaster.select(device);

    if (!res.success) {
      this.isStarting = false;

      return;
    }

    try {
      this.currentDevice = device;

      if (promarkModels.has(device.model)) {
        this.previewManager = new PromarkPreviewManager(device);
      } else if (Constant.adorModels.includes(device.model)) {
        this.previewManager = new AdorPreviewManager(device);
      } else if (device.model === 'fbb2') {
        this.previewManager = new BB2PreviewManager(device);
      } else {
        this.previewManager = new BeamPreviewManager(device);
      }

      const setupRes = await this.previewManager.setup({ progressId: 'preview-mode-controller' });

      if (!setupRes) {
        this.isStarting = false;

        return;
      }

      PreviewModeBackgroundDrawer.start(this.previewManager.getCameraOffset?.());
      PreviewModeBackgroundDrawer.drawBoundary();
      deviceMaster.setDeviceControlReconnectOnClose(device);
      this.errorCallback = errCallback;
      this.isPreviewModeOn = true;
      canvasEventEmitter.emit('UPDATE_CONTEXT');
    } catch (error) {
      console.error(error);
      await this.end();
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  async end({ shouldWaitForEnd = false }: { shouldWaitForEnd?: boolean } = {}) {
    console.log('end of pmc');
    this.isPreviewModeOn = false;

    if (this.liveModeTimeOut) {
      clearTimeout(this.liveModeTimeOut);
    }

    this.liveModeTimeOut = null;
    PreviewModeBackgroundDrawer.clearBoundary();
    PreviewModeBackgroundDrawer.end();

    const { currentDevice } = this;

    if (currentDevice) {
      deviceMaster.setDeviceControlDefaultCloseListener(currentDevice);
    }

    if (shouldWaitForEnd) {
      await this.previewManager?.end();
    } else {
      this.previewManager?.end();
    }

    this.reset();
  }

  isLiveModeOn = () => !!(this.isPreviewModeOn && this.liveModeTimeOut);

  toggleFullWorkareaLiveMode() {
    if (this.liveModeTimeOut) {
      this.stopFullWorkareaLiveMode();
    } else {
      this.startFullWorkareaLiveMode();
    }
  }

  startFullWorkareaLiveMode() {
    if (!this.isPreviewModeOn || !this.previewManager?.previewFullWorkarea) {
      return;
    }

    const setNextTimeout = () => {
      this.liveModeTimeOut = setTimeout(() => {
        this.fullWorkareaLiveUpdate(() => {
          if (this.liveModeTimeOut) {
            setNextTimeout();
          }
        });
      }, 1000);
    };

    setNextTimeout();
  }

  stopFullWorkareaLiveMode() {
    if (this.liveModeTimeOut) {
      clearTimeout(this.liveModeTimeOut);
    }

    this.liveModeTimeOut = null;
  }

  async fullWorkareaLiveUpdate(callback = () => {}) {
    await this.reloadHeightOffset();
    await this.previewFullWorkarea(callback);
  }

  prePreview = (): boolean => {
    const { isPreviewBlocked, isPreviewModeOn } = this;

    if (isPreviewBlocked || !isPreviewModeOn) {
      return false;
    }

    this.isDrawing = true;
    this.isPreviewBlocked = true;

    const workarea = document.querySelector('#workarea') as HTMLElement;

    workarea.style.cursor = 'wait';

    return true;
  };

  onPreviewSuccess = (): void => {
    const workarea = document.querySelector('#workarea') as HTMLElement;

    workarea.style.cursor = 'url(img/camera-cursor.svg) 9 12, cell';
    this.isPreviewBlocked = false;
    this.isDrawing = false;
  };

  onPreviewFail = (error: Error): void => {
    if (this.isPreviewModeOn) {
      console.log(error);

      Alert.popUpError({ message: error.message || (error as any).text });
    }

    const workarea = document.querySelector('#workarea') as HTMLElement;

    workarea.style.cursor = 'auto';

    if (!PreviewModeBackgroundDrawer.isClean()) {
      this.isDrawing = false;
    }

    this.end();
  };

  async previewFullWorkarea(callback = () => {}): Promise<boolean> {
    const res = this.prePreview();

    if (!res) {
      return false;
    }

    try {
      if (!this.previewManager.previewFullWorkarea) {
        return false;
      }

      await this.previewManager.previewFullWorkarea?.();
      this.onPreviewSuccess();
      callback();

      return true;
    } catch (error) {
      this.onPreviewFail(error);
      callback();

      return false;
    }
  }

  async preview(
    x: number,
    y: number,
    opts: {
      callback?: () => void;
      last?: boolean;
      overlapRatio?: number;
    } = {},
  ): Promise<boolean> {
    const res = this.prePreview();

    if (!res) {
      return false;
    }

    const { callback } = opts;

    try {
      const previewRes = await this.previewManager.preview(x, y);

      if (previewRes) {
        this.onPreviewSuccess();
      }

      callback();

      return previewRes;
    } catch (error) {
      this.onPreviewFail(error);
      callback();

      return false;
    }
  }

  async previewRegion(x1, y1, x2, y2, opts: { callback?: () => void; overlapRatio?: number } = {}) {
    const res = this.prePreview();

    if (!res) {
      return false;
    }

    const { callback } = opts;

    try {
      const previewRes = await this.previewManager.previewRegion(x1, y1, x2, y2, opts);

      if (previewRes) {
        this.onPreviewSuccess();
      }

      callback();

      return previewRes;
    } catch (error) {
      this.onPreviewFail(error);
      callback();

      return false;
    }
  }

  isPreviewMode() {
    return this.isPreviewModeOn;
  }

  getCameraOffset(): CameraParameters {
    return this.previewManager.getCameraOffset?.() || null;
  }

  getCameraOffsetStandard(): CameraConfig {
    return this.previewManager.getCameraOffsetStandard?.() || null;
  }

  async reset() {
    this.previewManager = null;
    this.currentDevice = null;
    this.isPreviewModeOn = false;
    this.isPreviewBlocked = false;
    deviceMaster.disconnectCamera();
  }

  // movementX, movementY in mm
  async getPhotoAfterMoveTo(movementX: number, movementY: number) {
    const imgUrl = await this.previewManager.getPhotoAfterMoveTo?.(movementX, movementY);

    return imgUrl;
  }
}

const instance = new PreviewModeController();

export default instance;
