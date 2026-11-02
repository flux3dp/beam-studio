import Beamo2PreviewManager from '@core/app/actions/camera/preview-helper/Beamo2PreviewManager';
import { CanvasMode } from '@core/app/constants/canvasMode';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import backgroundTasks from '@core/helpers/device/background';
import canTouchMachine from '@core/helpers/device/background/canTouchMachine';
import type { BackgroundContext, BackgroundTask } from '@core/helpers/device/background/types';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const DOOR_POLL_MS = 500;
/** fbm2: the door must have been open this long for a close to count */
const OPEN_MIN_MS = 2000;
/** fbm2: wait this long after the close; reopening in between cancels */
const CLOSE_DELAY_MS = 1000;

const log = (...args: unknown[]) => console.log('[autoFullAreaPreview]', ...args);

/** Captures a full-area photo when the user closes the machine door (docs/prd/auto-full-area-preview.md) */
class AutoFullAreaPreview implements BackgroundTask {
  readonly id = 'auto-full-area-preview';
  readonly models: ReadonlySet<WorkAreaModel> = new Set<WorkAreaModel>(['fbb2', 'fbm2', 'fhx2rf']);
  private device: IDeviceInfo | null = null;
  private timer: NodeJS.Timeout | null = null;
  private polling = false;
  /** Door open since (ms) */
  private openedAt: null | number = null;
  /** fbm2: closed at (ms) after a long enough open; capture CLOSE_DELAY_MS later */
  private armedAt: null | number = null;
  private capture: null | Promise<void> = null;
  private manager: Beamo2PreviewManager | null = null;
  private aborted = false;

  isEnabled = ({ device, mode, workarea }: BackgroundContext): boolean =>
    mode === CanvasMode.Draw &&
    workarea === device?.model &&
    useGlobalPreferenceStore.getState()['auto-full-area-preview'] &&
    !useDocumentStore.getState()['enable-job-origin'];

  isBusy = (): boolean => this.capture !== null;

  busyMessage = (): string => i18n.lang.message.auto_preview.abort_to_continue;

  /** Waits for the in-flight manager step (raw commands must not interleave), then ends without drawing */
  abort = async (): Promise<void> => {
    this.aborted = true;
    this.manager?.cancel();
    await this.capture;
  };

  start = (device: IDeviceInfo): void => {
    this.stop();
    this.device = device;
    this.timer = setInterval(this.tick, DOOR_POLL_MS);
  };

  stop = (): void => {
    if (this.timer) clearInterval(this.timer);

    this.timer = null;
    this.openedAt = null;
    this.armedAt = null;

    if (this.capture) this.abort();
  };

  private tick = async (): Promise<void> => {
    // A sub-task (raw mode) answers door queries differently; null after a kick is fine, getControl reconnects
    if (this.polling || this.capture || !backgroundTasks.isCurrent(this) || deviceMaster.currentControlMode) return;

    this.polling = true;
    try {
      const { value } = await deviceMaster.getDoorOpen();

      this.onDoor(value === '1', Date.now());
    } catch (error) {
      log('getDoorOpen failed', error);
    } finally {
      this.polling = false;
    }
  };

  private onDoor = (isOpen: boolean, now: number): void => {
    if (this.device?.model !== 'fbm2') return;

    if (isOpen) {
      this.armedAt = null;
      this.openedAt ??= now;

      return;
    }

    if (this.openedAt !== null) {
      if (now - this.openedAt >= OPEN_MIN_MS) this.armedAt = now;

      this.openedAt = null;
    }

    if (this.armedAt !== null && now - this.armedAt >= CLOSE_DELAY_MS) {
      this.armedAt = null;
      this.aborted = false;
      this.capture = this.captureFbm2().finally(() => {
        this.capture = null;
      });
    }
  };

  private canCapture = async (): Promise<boolean> => {
    const { mouseMode } = useCanvasStore.getState();

    return mouseMode !== 'preview' && mouseMode !== 'pre_preview' && (await canTouchMachine(this));
  };

  private captureFbm2 = async (): Promise<void> => {
    if (!(await this.canCapture())) {
      log('skipped: machine or canvas busy');

      return;
    }

    const manager = new Beamo2PreviewManager(this.device!);

    this.manager = manager;

    try {
      // setup ends the manager itself on failure
      if (!(await manager.setup({ messagePrefix: i18n.lang.message.auto_preview.prefix, silent: true }))) return;

      try {
        if (!this.aborted) await manager.previewFullWorkarea();
      } catch (error) {
        log('capture failed', error);
      } finally {
        // null = control socket closed (kicked): end() would reconnect and kick the other client
        if (deviceMaster.currentControlMode === null) deviceMaster.disconnectCamera();
        else await manager.end();
      }
    } finally {
      this.manager = null;
    }
  };
}

const autoFullAreaPreview = new AutoFullAreaPreview();

/** Called once at startup (BeamboxInit) */
export const registerAutoFullAreaPreview = (): void => {
  useGlobalPreferenceStore.subscribe((state) => state['auto-full-area-preview'], backgroundTasks.refresh);
  useDocumentStore.subscribe((state) => state['enable-job-origin'], backgroundTasks.refresh);
  backgroundTasks.register(autoFullAreaPreview);
};

export default autoFullAreaPreview;
