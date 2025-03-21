import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import tabController from '@core/app/actions/tabController';
import { showFramingModal } from '@core/app/components/dialogs/FramingModal';
import { CanvasMode } from '@core/app/constants/canvasMode';
import FullWindowPanelStyles from '@core/app/widgets/FullWindowPanel/FullWindowPanel.module.scss';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

type TStatus =
  | 'idle'
  | 'listening'
  | 'preparing' // Start exporting task (before uploadFcode)
  | 'uploading'; // uploadFcode

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

const interval = 200;
const runningThresholdCount = 8;

const modalId = {
  framing: 'framing-modal',
  material: 'material-test-generator',
  monitor: 'monitor',
};

const closeFrame = async () => {
  if (dialogCaller.isIdExist(modalId.framing)) {
    dialogCaller.popDialogById(modalId.framing);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

class PromarkButtonHandler {
  private requirements = {
    context: false, // In safe CanvasMode and Selecting Promark
    enabled: false, // promark-start-button Enabled
    tab: false, // Current tab is focused
    workarea: false, // Using Promark workarea
  };
  private shouldFrameFirst = false;
  private device: IDeviceInfo | null = null;
  private status: TStatus = 'idle';
  private timer: NodeJS.Timeout | null = null;
  private counter = 0;
  private exportFn: (byManager: boolean) => Promise<void> = async () => {};

  constructor() {
    canvasEventEmitter.on('document-settings-saved', this.onDocChanged);
    this.onDocChanged();
    canvasEventEmitter.on('model-changed', this.onModelChanged);
    this.onModelChanged();
    this.updateRequirement('tab', isWeb() || tabController.getCurrentId() < 3);
    tabController.onFocused(this.onTabFocused);
    tabController.onBlurred(this.onTabBlurred);
  }

  setExportFn = (exportFn?: (byManager: boolean) => Promise<void>): void => {
    this.exportFn = exportFn;
  };

  onContextChanged = (mode: CanvasMode, device: IDeviceInfo | null): void => {
    this.device = device;
    this.updateRequirement(
      'context',
      (mode === CanvasMode.Draw || mode === CanvasMode.PathPreview) && promarkModels.has(this.device?.model),
    );
  };

  onDocChanged = (): void => {
    this.shouldFrameFirst = beamboxPreference.read('frame-before-start');
    this.updateRequirement('enabled', beamboxPreference.read('promark-start-button'));
  };

  onModelChanged = (): void => {
    const workarea = beamboxPreference.read('workarea');

    this.updateRequirement('workarea', promarkModels.has(workarea));
  };

  onTabFocused = (): void => {
    this.updateRequirement('tab', true);
  };

  onTabBlurred = (): void => {
    this.updateRequirement('tab', false);
  };

  updateRequirement = (key: keyof typeof this.requirements, val: boolean): void => {
    this.requirements = { ...this.requirements, [key]: val };

    const isEnable = Object.values(this.requirements).every(Boolean);

    if (!isEnable) {
      this.stopListening();
    } else if (this.status === 'idle') {
      this.startListening();
    }
  };

  startListening = (): void => {
    this.stopListening();

    if (deviceMaster.currentDevice?.info?.serial !== this.device.serial) {
      deviceMaster.select(this.device);
    }

    this.status = 'listening';
    this.timer = setInterval(this.checkButton, interval);
  };

  stopListening = (): void => {
    this.status = 'idle';
    this.counter = 0;

    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  setStatus = (newStatus: TStatus): void => {
    if (this.status !== 'idle') {
      this.status = newStatus;
    }
  };

  handleTaskFinish = (): void => {
    if (this.status === 'preparing') {
      // Reset status if export task failed
      this.setStatus('listening');
    }
  };

  shouldListen = (): boolean => {
    if (this.status !== 'listening') {
      return false;
    }

    // Skip when special modal exist
    if (dialogCaller.isIdExist(modalId.material) || document.querySelector(`.${FullWindowPanelStyles.container}`)) {
      return false;
    }

    return true;
  };

  checkButton = async (): Promise<void> => {
    if (!this.shouldListen()) {
      return;
    }

    const { isFraming = false, isRunning = false, pressed } = await deviceMaster.checkButton();

    if (!pressed) {
      this.counter = 0;

      return;
    }

    if (isRunning && !isFraming) {
      return;
    }

    if (!this.shouldListen()) {
      return;
    }

    this.counter += 1;

    if (this.shouldFrameFirst) {
      if (this.counter === 1) {
        // Force framing on first press
        await closeFrame();
        dialogCaller.popDialogById(modalId.monitor);
        canvasEventEmitter.emit('SET_MODE', CanvasMode.Draw);
        showFramingModal();

        return;
      }

      if (this.counter !== runningThresholdCount) {
        return;
      }
    } else if (this.counter > 1) {
      return;
    }

    if (!this.shouldListen()) {
      return;
    }

    this.status = 'uploading';
    await closeFrame();
    dialogCaller.popDialogById(modalId.monitor);
    await this.exportFn(true);
  };
}

const promarkButtonHandler = new PromarkButtonHandler();

export default promarkButtonHandler;
