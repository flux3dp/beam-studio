import { promarkModels } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import { showFramingModal } from '@core/app/components/dialogs/FramingModal';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import FullWindowPanelStyles from '@core/app/widgets/FullWindowPanel/FullWindowPanel.module.scss';
import backgroundTasks from '@core/helpers/device/background';
import type { BackgroundContext, BackgroundTask } from '@core/helpers/device/background/types';
import deviceMaster from '@core/helpers/device-master';

type TStatus =
  | 'idle'
  | 'listening'
  | 'preparing' // Start exporting task (before uploadFcode)
  | 'uploading'; // uploadFcode

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

class PromarkButtonHandler implements BackgroundTask {
  readonly id = 'promark-button';
  readonly models = promarkModels;
  private status: TStatus = 'idle';
  private timer: NodeJS.Timeout | null = null;
  private counter = 0;
  private exportFn: (byManager: boolean) => Promise<void> = async () => {};

  constructor() {
    useDocumentStore.subscribe((state) => state['promark-start-button'], backgroundTasks.refresh);
  }

  setExportFn = (exportFn: (byManager: boolean) => Promise<void>): void => {
    this.exportFn = exportFn;
  };

  isEnabled = ({ mode, workarea }: BackgroundContext): boolean =>
    (mode === CanvasMode.Draw || mode === CanvasMode.PathPreview) &&
    promarkModels.has(workarea) &&
    useDocumentStore.getState()['promark-start-button'];

  // Never blocks a foreground action: the button's own export is the foreground action
  isBusy = (): boolean => false;

  abort = async (): Promise<void> => {};

  start = (): void => {
    this.stop();
    this.status = 'listening';
    this.timer = setInterval(this.checkButton, interval);
  };

  stop = (): void => {
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
    if (this.status !== 'listening' || !backgroundTasks.isCurrent(this)) {
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

    if (useDocumentStore.getState()['frame-before-start']) {
      if (this.counter === 1) {
        // Force framing on first press
        await closeFrame();
        dialogCaller.popDialogById(modalId.monitor);
        useCanvasStore.getState().setMode(CanvasMode.Draw);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for dialog to close, not really needed here but just in case
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

    this.status = 'preparing';
    await closeFrame();
    dialogCaller.popDialogById(modalId.monitor);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for dialog to close
    await this.exportFn(true);
  };
}

const promarkButtonHandler = new PromarkButtonHandler();

backgroundTasks.register(promarkButtonHandler);

export default promarkButtonHandler;
