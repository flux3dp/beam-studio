import type { CanvasMode } from '@core/app/constants/canvasMode';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

/**
 * Every background task and its rank, in one place. Higher wins when two tasks want the same machine.
 * Spaced by 10 so a new task can slot in between; no two tasks may share a value.
 */
export const BACKGROUND_TASK_PRIORITY = {
  'auto-full-area-preview': 10, // convenience; may always yield
  'promark-button': 20, // the user pressed a physical button
} as const;

export type BackgroundTaskId = keyof typeof BACKGROUND_TASK_PRIORITY;

export interface BackgroundContext {
  /** The machine selected in the top bar: the target of every task */
  device: IDeviceInfo | null;
  mode: CanvasMode;
  tabFocused: boolean;
  /** Document workarea */
  workarea: WorkAreaModel;
}

export interface BackgroundTask {
  /** Stop busy work and leave the machine clean */
  abort: () => Promise<void>;
  /** Prompt text for the foreground yield; required when isBusy can be true */
  busyMessage?: () => string;
  id: BackgroundTaskId;
  /** Doing something a foreground machine action must not overlap */
  isBusy: () => boolean;
  /** Task-only rules: canvas modes, workarea rule, preferences */
  isEnabled: (ctx: BackgroundContext) => boolean;
  models: ReadonlySet<WorkAreaModel>;
  /** Begin polling; the manager has already asked deviceMaster to select the device */
  start: (device: IDeviceInfo) => void;
  /** Stop polling; if busy, abort without waiting */
  stop: () => void;
}
