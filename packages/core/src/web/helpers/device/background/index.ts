import tabController from '@core/app/actions/tabController';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
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
  private ctx: BackgroundContext;
  /** `winner>loser` pairs already reported */
  private warned = new Set<string>();

  constructor() {
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
  }

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
    const { device, tabFocused } = this.ctx;
    // Tasks are sorted by priority, so the first one to want a machine claims it
    const claimedBy = new Map<string, BackgroundTaskId>();
    // Start only after every stop, so a machine never has two tasks at once
    const toStart: BackgroundTask[] = [];

    for (const task of this.tasks) {
      let want = Boolean(device && tabFocused && task.models.has(device.model) && task.isEnabled(this.ctx));

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
    this.ctx = { ...this.ctx, ...patch };
    this.refresh();
  };
}

const backgroundTasks = new BackgroundTasks();

export default backgroundTasks;
