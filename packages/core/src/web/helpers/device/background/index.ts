import alertCaller from '@core/app/actions/alert-caller';
import tabController from '@core/app/actions/tabController';
import alertConstants from '@core/app/constants/alert-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import type { BackgroundContext, BackgroundTask, BackgroundTaskId } from './types';
import { BACKGROUND_TASK_PRIORITY } from './types';

const isVisible = (): boolean => document.visibilityState === 'visible';

/**
 * Coordinates features that talk to the selected machine while the user is not asking for anything.
 * See docs/prd/background-tasks.md.
 */
class BackgroundTasks {
  private tasks: BackgroundTask[] = [];
  /** task id → the machine it was started on */
  private running = new Map<BackgroundTaskId, IDeviceInfo>();
  private ctx: BackgroundContext | null = null;
  /** `winner>loser` pairs already reported */
  private warned = new Set<string>();

  /**
   * Subscribe on first use instead of at import: check-device-status imports this module, and reading
   * tabController or the stores while an import cycle is still loading would see undefined.
   */
  private init = (): BackgroundContext => {
    if (this.ctx) return this.ctx;

    this.ctx = {
      device: null,
      mode: useCanvasStore.getState().mode,
      tabFocused: isWeb() ? isVisible() : tabController.isFocused,
      workarea: useDocumentStore.getState().workarea,
    };
    useCanvasStore.subscribe(
      (state) => state.mode,
      (mode) => this.update({ mode }),
    );
    useDocumentStore.subscribe(
      (state) => state.workarea,
      (workarea) => this.update({ workarea }),
    );

    if (isWeb()) {
      // tabController never reports focus on web; listening here keeps it untouched (PRD §7.5)
      document.addEventListener('visibilitychange', () => this.update({ tabFocused: isVisible() }));
    } else {
      tabController.onFocused(() => this.update({ tabFocused: true }));
      tabController.onBlurred(() => this.update({ tabFocused: false }));
    }

    return this.ctx;
  };

  /** Fed from the top bar's selected device */
  setDevice = (device: IDeviceInfo | null): void => {
    this.update({ device });
  };

  register = (task: BackgroundTask): void => {
    this.tasks = [...this.tasks, task].sort((a, b) => BACKGROUND_TASK_PRIORITY[b.id] - BACKGROUND_TASK_PRIORITY[a.id]);
    this.refresh();
  };

  /** True when deviceMaster currently talks to the machine the task was started on */
  isCurrent = (task: BackgroundTask): boolean => {
    const device = this.running.get(task.id);

    return Boolean(device) && deviceMaster.currentDevice?.info.serial === device!.serial;
  };

  /**
   * Called by checkDeviceStatus before a foreground machine action. A busy task on another machine is
   * aborted silently; on the same machine the user confirms first. Resolves false when the user declines.
   */
  yieldTo = async (device: IDeviceInfo): Promise<boolean> => {
    for (const task of this.tasks) {
      const runningOn = this.running.get(task.id);

      if (!runningOn || !task.isBusy()) continue;

      if (runningOn.uuid === device.uuid) {
        const confirmed = await new Promise<boolean>((resolve) => {
          alertCaller.popUp({
            buttonType: alertConstants.YES_NO,
            message: task.busyMessage?.() ?? i18n.lang.message.device_is_used,
            onNo: () => resolve(false),
            onYes: () => resolve(true),
          });
        });

        if (!confirmed) return false;
      }

      await task.abort();
    }

    return true;
  };

  list = () =>
    this.tasks.map((task) => ({
      busy: task.isBusy(),
      device: this.running.get(task.id)?.serial ?? null,
      id: task.id,
      priority: BACKGROUND_TASK_PRIORITY[task.id],
      running: this.running.has(task.id),
    }));

  /** Re-evaluate every task; call when a task's own setting changed */
  refresh = (): void => {
    const ctx = this.init();
    const { device, tabFocused } = ctx;
    // Tasks are sorted by priority, so the first one to want a machine claims it
    const claimedBy = new Map<string, BackgroundTaskId>();
    // Start only after every stop, so a machine never has two tasks at once
    const toStart: BackgroundTask[] = [];

    for (const task of this.tasks) {
      let want = Boolean(device && tabFocused && task.models.has(device.model) && task.isEnabled(ctx));

      if (want) {
        const owner = claimedBy.get(device!.serial);

        if (owner) {
          this.warnOnce(owner, task.id);
          want = false;
        } else {
          claimedBy.set(device!.serial, task.id);
        }
      }

      const runningOn = this.running.get(task.id);

      if (runningOn && (!want || runningOn.serial !== device!.serial)) this.stopTask(task);

      if (want && !this.running.has(task.id)) toStart.push(task);
    }

    toStart.forEach((task) => this.startTask(task, device!));
  };

  private warnOnce = (winner: BackgroundTaskId, loser: BackgroundTaskId): void => {
    const key = `${winner}>${loser}`;

    if (this.warned.has(key)) return;

    this.warned.add(key);
    console.warn(`[backgroundTasks] ${loser} yields the machine to higher-priority ${winner}`);
  };

  private startTask = (task: BackgroundTask, device: IDeviceInfo): void => {
    if (deviceMaster.currentDevice?.info.serial !== device.serial) {
      deviceMaster.select(device);
    }

    this.running.set(task.id, device);
    task.start(device);
  };

  private stopTask = (task: BackgroundTask): void => {
    this.running.delete(task.id);
    task.stop();
  };

  private update = (patch: Partial<BackgroundContext>): void => {
    this.ctx = { ...this.init(), ...patch };
    this.refresh();
  };
}

const backgroundTasks = new BackgroundTasks();

export default backgroundTasks;
