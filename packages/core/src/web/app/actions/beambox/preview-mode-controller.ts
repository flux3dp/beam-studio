import Alert from '@core/app/actions/alert-caller';
import Constant, { promarkModels } from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { setCameraPreviewState } from '@core/app/stores/cameraPreview';
import { useDocumentStore } from '@core/app/stores/documentStore';
import checkDeviceStatus from '@core/helpers/check-device-status';
import checkOldFirmware from '@core/helpers/device/checkOldFirmware';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import VersionChecker from '@core/helpers/version-checker';
import type { CameraConfig, CameraParameters } from '@core/interfaces/Camera';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import AdorPreviewManager from '../camera/preview-helper/AdorPreviewManager';
import Bb2Hx2PreviewManager from '../camera/preview-helper/Bb2Hx2PreviewManager';
import Beamo2PreviewManager from '../camera/preview-helper/Beamo2PreviewManager';
import BeamPreviewManager from '../camera/preview-helper/BeamPreviewManager';
import PromarkPreviewManager from '../camera/preview-helper/PromarkPreviewManager';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

class PreviewModeController {
  isDrawing: boolean = false;
  isPreviewMode: boolean = false;
  startPromise: null | Promise<void> = null;
  isStarting: boolean = false;
  isPreviewBlocked: boolean = false;
  currentDevice: IDeviceInfo | null = null;
  previewManager: null | PreviewManager = null;
  liveModeTimeOut: NodeJS.Timeout | null = null;

  constructor() {}

  get isFullArea() {
    return this.previewManager?.previewMode === PreviewMode.FULL_AREA;
  }

  setIsPreviewMode = (val: boolean) => {
    this.isPreviewMode = val;
    setCameraPreviewState({ isPreviewMode: val });
  };

  setIsDrawing = (val: boolean) => {
    this.isDrawing = val;
    setCameraPreviewState({ isDrawing: val });
  };

  setIsStarting = (val: boolean) => {
    this.isStarting = val;
    setCameraPreviewState({ isStarting: val });
  };

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
    const { lang } = i18n;

    if (!vc.meetRequirement('USABLE_VERSION')) {
      Alert.popUp({
        message: lang.beambox.popup.should_update_firmware_to_continue,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
      Progress.popById('start-preview-controller');

      return false;
    }

    if (useDocumentStore.getState().borderless && !vc.meetRequirement('BORDERLESS_MODE')) {
      const message = `#814 ${lang.calibration.update_firmware_msg1} 2.5.1 ${lang.calibration.update_firmware_msg2} ${lang.beambox.popup.or_turn_off_borderless_mode}`;
      const caption = lang.beambox.left_panel.borderless_preview;

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

  async start(device: IDeviceInfo) {
    this.startPromise = (async () => {
      this.reset();
      this.setIsStarting(true);

      const res = await deviceMaster.select(device);

      if (!res.success) {
        this.setIsStarting(false);

        return;
      }

      try {
        this.currentDevice = device;

        if (promarkModels.has(device.model)) {
          this.previewManager = new PromarkPreviewManager(device);
        } else if (Constant.adorModels.includes(device.model)) {
          this.previewManager = new AdorPreviewManager(device);
        } else if (['fbb2', 'fhx2rf'].includes(device.model)) {
          this.previewManager = new Bb2Hx2PreviewManager(device);
        } else if (device.model === 'fbm2') {
          this.previewManager = new Beamo2PreviewManager(device);
        } else {
          this.previewManager = new BeamPreviewManager(device);
        }

        const setupRes = await this.previewManager.setup({ progressId: 'preview-mode-controller' });

        if (!setupRes) {
          this.setIsStarting(false);

          return;
        }

        PreviewModeBackgroundDrawer.start(this.previewManager.getCameraOffset?.());
        deviceMaster.setDeviceControlReconnectOnClose(device);
        this.setIsPreviewMode(true);

        setCameraPreviewState({
          isSwitchable: this.previewManager.isSwitchable,
          previewMode: this.previewManager.previewMode,
        });

        canvasEventEmitter.emit('UPDATE_CONTEXT');
      } catch (error) {
        console.error(error);
        await this.end();
        throw error;
      } finally {
        this.setIsStarting(false);
      }
    })();
    await this.startPromise;
    this.startPromise = null;
  }

  async end({ shouldWaitForEnd = false }: { shouldWaitForEnd?: boolean } = {}) {
    console.log('end of pmc', this.isStarting, this.isPreviewMode);

    this.setIsStarting(false);
    this.setIsPreviewMode(false);
    this.setIsDrawing(false);
    await this.startPromise;

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

  isLiveModeOn = () => !!(this.isPreviewMode && this.liveModeTimeOut);

  toggleFullWorkareaLiveMode() {
    if (this.liveModeTimeOut) {
      this.stopFullWorkareaLiveMode();
    } else {
      this.startFullWorkareaLiveMode();
    }
  }

  startFullWorkareaLiveMode() {
    if (!this.isPreviewMode || !this.previewManager?.previewFullWorkarea) {
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
      setCameraPreviewState({ isLiveMode: true });
    };

    setNextTimeout();
  }

  stopFullWorkareaLiveMode() {
    if (this.liveModeTimeOut) {
      clearTimeout(this.liveModeTimeOut);
    }

    this.liveModeTimeOut = null;
    setCameraPreviewState({ isLiveMode: false });
  }

  async fullWorkareaLiveUpdate(callback = () => {}) {
    await this.reloadHeightOffset();
    await this.previewFullWorkarea(callback);
  }

  prePreview = (): boolean => {
    const { isPreviewBlocked, isPreviewMode } = this;

    if (isPreviewBlocked || !isPreviewMode) {
      return false;
    }

    this.setIsDrawing(true);
    this.isPreviewBlocked = true;

    return true;
  };

  onPreviewSuccess = (): void => {
    this.isPreviewBlocked = false;
    this.setIsDrawing(false);
  };

  onPreviewFail = (error: unknown): void => {
    if (this.isPreviewMode) {
      console.log(error);

      Alert.popUpError({ message: (error as Error).message || (error as any).text });
    }

    this.end();
  };

  async previewFullWorkarea(callback?: () => void): Promise<boolean> {
    const res = this.prePreview();

    if (!res) {
      return false;
    }

    try {
      if (!this.previewManager?.previewFullWorkarea) {
        return false;
      }

      await this.previewManager?.previewFullWorkarea?.();
      this.onPreviewSuccess();
      callback?.();

      return true;
    } catch (error) {
      this.onPreviewFail(error);
      callback?.();

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
      const previewRes = await this.previewManager!.preview(x, y);

      if (previewRes) {
        this.onPreviewSuccess();
      }

      callback?.();

      return previewRes;
    } catch (error) {
      this.onPreviewFail(error);
      callback?.();

      return false;
    }
  }

  async previewRegion(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts: { callback?: () => void; overlapRatio?: number } = {},
  ) {
    const res = this.prePreview();

    if (!res) {
      return false;
    }

    const { callback } = opts;

    try {
      const previewRes = await this.previewManager!.previewRegion(x1, y1, x2, y2, opts);

      if (previewRes) {
        this.onPreviewSuccess();
      }

      callback?.();

      return previewRes;
    } catch (error) {
      this.onPreviewFail(error);
      callback?.();

      return false;
    }
  }

  getCameraOffset(): CameraParameters | null {
    return this.previewManager?.getCameraOffset?.() || null;
  }

  getCameraOffsetStandard(): CameraConfig | null {
    return this.previewManager?.getCameraOffsetStandard?.() || null;
  }

  async reset() {
    this.previewManager = null;
    this.currentDevice = null;
    this.setIsPreviewMode(false);
    this.isPreviewBlocked = false;
    deviceMaster.disconnectCamera();
  }

  // movementX, movementY in mm
  async getPhotoAfterMoveTo(movementX: number, movementY: number) {
    const imgUrl = await this.previewManager!.getPhotoAfterMoveTo?.(movementX, movementY);

    return imgUrl;
  }

  switchPreviewMode = async (mode: PreviewMode): Promise<void> => {
    if (!this.previewManager?.switchPreviewMode) return;

    const newMode = await this.previewManager.switchPreviewMode(mode);

    setCameraPreviewState({ previewMode: newMode });
  };
}

const previewModeController = new PreviewModeController();

export default previewModeController;
