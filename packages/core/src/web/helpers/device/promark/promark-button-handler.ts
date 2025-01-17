import beamboxPreference from 'app/actions/beambox/beambox-preference';
import deviceMaster from 'helpers/device-master';
import dialogCaller from 'app/actions/dialog-caller';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FullWindowPanelStyles from 'app/widgets/FullWindowPanel/FullWindowPanel.module.scss';
import isWeb from 'helpers/is-web';
import tabController from 'app/actions/tabController';
import { CanvasMode } from 'app/constants/canvasMode';
import { IDeviceInfo } from 'interfaces/IDevice';
import { promarkModels } from 'app/actions/beambox/constant';
import { showFramingModal } from 'app/components/dialogs/FramingModal';

type TStatus =
  | 'idle'
  | 'listening'
  | 'preparing' // Start exporting task (before uploadFcode)
  | 'uploading'; // uploadFcode

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

const interval = 200;
const runningThresholdCount = 8;

const modalId = {
  material: 'material-test-generator',
  framing: 'framing-modal',
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
    enabled: false, // promark-start-button Enabled
    workarea: false, // Using Promark workarea
    context: false, // In safe CanvasMode and Selecting Promark
    tab: false, // Current tab is focused
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
      (mode === CanvasMode.Draw || mode === CanvasMode.PathPreview) &&
        promarkModels.has(this.device?.model)
    );
  };

  onDocChanged = (): void => {
    this.shouldFrameFirst = !!beamboxPreference.read('frame-before-start');
    this.updateRequirement('enabled', !!beamboxPreference.read('promark-start-button'));
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
    if (!isEnable) this.stopListening();
    else if (this.status === 'idle') this.startListening();
  };

  startListening = (): void => {
    this.stopListening();
    if (deviceMaster.currentDevice?.info?.serial !== this.device.serial)
      deviceMaster.select(this.device);
    this.status = 'listening';
    this.timer = setInterval(this.checkButton, interval);
  };

  stopListening = (): void => {
    this.status = 'idle';
    this.counter = 0;
    if (this.timer) clearInterval(this.timer);
  };

  setStatus = (newStatus: TStatus): void => {
    if (this.status !== 'idle') this.status = newStatus;
  };

  handleTaskFinish = (): void => {
    if (this.status === 'preparing')
      // Reset status if export task failed
      this.setStatus('listening');
  };

  shouldListen = (): boolean => {
    if (this.status !== 'listening') return false;
    // Skip when special modal exist
    if (
      dialogCaller.isIdExist(modalId.material) ||
      document.querySelector(`.${FullWindowPanelStyles.container}`)
    )
      return false;
    return true;
  };

  checkButton = async (): Promise<void> => {
    if (!this.shouldListen()) return;
    const { pressed, isFraming = false, isRunning = false } = await deviceMaster.checkButton();
    if (!pressed) {
      this.counter = 0;
      return;
    }
    if (isRunning && !isFraming) {
      return;
    }
    if (!this.shouldListen()) return;
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
      if (this.counter !== runningThresholdCount) return;
    } else if (this.counter > 1) return;
    if (!this.shouldListen()) return;
    this.status = 'uploading';
    await closeFrame();
    dialogCaller.popDialogById(modalId.monitor);
    await this.exportFn(true);
  };
}

const promarkButtonHandler = new PromarkButtonHandler();

export default promarkButtonHandler;
