import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import Beamo2PreviewManager from '@core/app/actions/camera/preview-helper/Beamo2PreviewManager';
import { getWideAngleCameraData } from '@core/app/actions/camera/preview-helper/getWideAngleCameraData';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { bb2FullAreaPerspectiveGrid, hx2FullAreaPerspectiveGrid } from '@core/app/constants/fisheyeCameraConstants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import backgroundTasks from '@core/helpers/device/background';
import canTouchMachine from '@core/helpers/device/background/canTouchMachine';
import type { BackgroundContext, BackgroundTask } from '@core/helpers/device/background/types';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV4 } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const DOOR_POLL_MS = 500;
/** fbm2: the door must have been open this long for a close to count */
const OPEN_MIN_MS = 2000;
/** fbm2: wait this long after the close; reopening in between cancels */
const CLOSE_DELAY_MS = 1000;
/** fbb2/fhx2rf: a photo must have finished this long before the close to count as taken with the lid open */
const SETTLE_MS = 1500;
const KEEP_PHOTOS = 4;
const LOOP_GUARD_MS = 200;
const LOOP_ERROR_MS = 1000;

const log = (...args: unknown[]) => console.log('[autoFullAreaPreview]', ...args);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Photo {
  finishedAt: number;
  url: string;
}

/**
 * Newest photo finished SETTLE_MS before the close, else the newest one finished while the door still read open
 * (`lastOpenAt`): a photo in flight at the close finishes after it and shows the closed lid
 */
export const pickPhoto = (photos: Photo[], closedAt: number, lastOpenAt: number): Photo | undefined => {
  const whileOpen = photos.filter(({ finishedAt }) => finishedAt <= lastOpenAt);

  return [...whileOpen].reverse().find(({ finishedAt }) => finishedAt <= closedAt - SETTLE_MS) ?? whileOpen.at(-1);
};

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
  /** fbb2/fhx2rf: lid closed at (ms); ends the open-lid loop */
  private closedAt: null | number = null;
  /** Sent time (ms) of the newest poll that read the door open */
  private lastOpenAt = 0;
  private capture: null | Promise<void> = null;
  private manager: Beamo2PreviewManager | null = null;
  private aborted = false;
  /** Why the last tick skipped polling; logged only when it changes */
  private pauseReason = '';

  isEnabled = ({ device, mode, workarea }: BackgroundContext): boolean =>
    mode === CanvasMode.Draw &&
    workarea === device?.model &&
    useGlobalPreferenceStore.getState()['auto-full-area-preview'] &&
    !useDocumentStore.getState()['enable-job-origin'];

  isBusy = (): boolean => this.capture !== null;

  busyMessage = (): string => i18n.lang.message.auto_preview.abort_to_continue;

  /** Waits for the in-flight step (raw commands must not interleave), then ends without drawing */
  abort = async (): Promise<void> => {
    log('abort requested');
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

  /** Why the door poll must not run now; '' = poll */
  private getPauseReason = (): string => {
    if (!backgroundTasks.isCurrent(this)) return 'not current';

    // The manager's DoorChecker owns the door during the fbm2 capture, and its setup runs normal-mode commands before
    // raw mode that polls would only queue behind. The open-lid loop keeps polling: it ends on the close it sees.
    if (this.capture && this.device?.model === 'fbm2') return 'capture';

    // A sub-task (raw mode) answers door queries differently. null = no socket (dropped or kicked): getControl would
    // reconnect with the connecting progress and connection-error alert every tick, so wait for the manager's silent
    // reconnect.
    if (deviceMaster.currentControlMode !== '') return `mode=${deviceMaster.currentControlMode}`;

    return '';
  };

  private tick = async (): Promise<void> => {
    if (this.polling) return;

    const pauseReason = this.getPauseReason();

    if (pauseReason !== this.pauseReason) log(pauseReason ? `polling paused: ${pauseReason}` : 'polling resumed');

    this.pauseReason = pauseReason;

    if (pauseReason) return;

    this.polling = true;
    try {
      const sentAt = Date.now();
      const { value } = await deviceMaster.getDoorOpen();
      const now = Date.now();

      // A slow answer means the control queue was busy; the door state is as of `now`, not `sentAt`
      if (now - sentAt > DOOR_POLL_MS) log(`getDoorOpen took ${now - sentAt}ms`);

      if (value === '1') this.lastOpenAt = sentAt;

      this.onDoor(value === '1', now);
    } catch (error) {
      log('getDoorOpen failed', error);
    } finally {
      this.polling = false;
    }
  };

  private onDoor = (isOpen: boolean, now: number): void => {
    const { openedAt } = this;

    if (isOpen && openedAt === null) log('door opened');
    else if (!isOpen && openedAt !== null) log(`door closed after ${now - openedAt}ms open`);

    this.openedAt = isOpen ? (openedAt ?? now) : null;

    if (this.device?.model !== 'fbm2') {
      if (isOpen && openedAt === null && !this.capture) this.startCapture(this.captureOpenLid);
      else if (!isOpen && openedAt !== null) this.closedAt = now;

      return;
    }

    if (isOpen) {
      if (this.armedAt !== null) log('disarmed: door reopened');

      this.armedAt = null;

      return;
    }

    if (openedAt !== null) {
      if (now - openedAt >= OPEN_MIN_MS) {
        this.armedAt = now;
        log(`armed, capture in ${CLOSE_DELAY_MS}ms`);
      } else {
        log(`ignored: open < ${OPEN_MIN_MS}ms`);
      }
    }

    if (this.armedAt !== null && now - this.armedAt >= CLOSE_DELAY_MS && !this.capture) {
      this.armedAt = null;
      this.startCapture(this.captureFbm2);
    }
  };

  private startCapture = (run: () => Promise<void>): void => {
    const startedAt = Date.now();

    log('capture start');
    this.aborted = false;
    this.closedAt = null;
    this.capture = run().finally(() => {
      log(`capture ${this.aborted ? 'aborted' : 'done'} after ${Date.now() - startedAt}ms`);
      this.capture = null;
    });
  };

  private canCapture = async (): Promise<boolean> => {
    const { mouseMode } = useCanvasStore.getState();

    if (mouseMode === 'preview' || mouseMode === 'pre_preview') {
      log(`skipped: mouseMode=${mouseMode}`);

      return false;
    }

    return canTouchMachine(this);
  };

  private captureFbm2 = async (): Promise<void> => {
    if (!(await this.canCapture())) {
      log('skipped: machine or canvas busy');

      return;
    }

    const manager = new Beamo2PreviewManager(this.device!);

    this.manager = manager;

    try {
      if (!(await manager.setup({ messagePrefix: i18n.lang.message.auto_preview.prefix, silent: true }))) {
        log('setup failed');

        // setup ends the manager on an error, but not when the door was open at its final check: the machine would
        // stay in raw mode (polling paused for good) with the camera socket open
        if (deviceMaster.currentControlMode === 'raw') await manager.end();
        else deviceMaster.disconnectCamera();

        return;
      }

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

  /** fbb2/fhx2rf: shoot back to back while the lid is open, draw the pick at close (no raw mode, no homing) */
  private captureOpenLid = async (): Promise<void> => {
    if (!(await this.canCapture())) {
      log('skipped: machine or canvas busy');

      return;
    }

    const device = this.device!;
    const photos: Photo[] = [];

    try {
      const { hasWideAngleCamera, parameters } = await getWideAngleCameraData(device);

      if (!hasWideAngleCamera || !parameters) {
        log('skipped: no wide-angle camera calibration');

        return;
      }

      await deviceMaster.connectCamera();

      if (!(await deviceMaster.setCamera(1))) throw new Error('Unable to switch to the wide-angle camera');

      const grids = device.model === 'fhx2rf' ? hx2FullAreaPerspectiveGrid : bb2FullAreaPerspectiveGrid;

      // Full area uses region_offsets; offset is dropped as in FisheyePreviewManagerV4.paramsToSend
      await deviceMaster.setFisheyeParam({ ...(parameters as FisheyeCameraParametersV4), grids, offset: undefined });
      // Height 0 assumes the material is focused; reading it would need raw mode
      await deviceMaster.setFisheyeObjectHeight(0);

      while (this.closedAt === null && !this.aborted) {
        try {
          const { imgBlob } = (await deviceMaster.takeOnePicture({ timeout: 5 })) ?? {};

          if (imgBlob) {
            photos.push({ finishedAt: Date.now(), url: URL.createObjectURL(imgBlob) });

            if (photos.length > KEEP_PHOTOS) URL.revokeObjectURL(photos.shift()!.url);
          }

          await sleep(LOOP_GUARD_MS);
        } catch (error) {
          log('photo failed', error);
          await sleep(LOOP_ERROR_MS);
        }
      }
    } catch (error) {
      log('wide-angle setup failed', error);
    } finally {
      deviceMaster.disconnectCamera();
    }

    const picked =
      this.aborted || this.closedAt === null ? undefined : pickPhoto(photos, this.closedAt, this.lastOpenAt);

    log(`${photos.length} photos, picked ${picked ? `${this.closedAt! - picked.finishedAt}ms before close` : 'none'}`);
    photos.forEach((photo) => photo !== picked && URL.revokeObjectURL(photo.url));

    if (!picked) return;

    await new Promise<void>((resolve) => previewModeBackgroundDrawer.drawFullWorkarea(picked.url, resolve));
    MessageCaller.openMessage({
      content: i18n.lang.message.auto_preview.prefix + i18n.lang.message.preview.succeeded,
      duration: 3,
      key: 'auto-full-area-preview',
      level: MessageLevel.SUCCESS,
    });
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
