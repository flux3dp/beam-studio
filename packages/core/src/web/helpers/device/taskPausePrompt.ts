import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import DeviceConstants from '@core/app/constants/device-constants';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import i18n from '@core/helpers/i18n';

export const TASK_PAUSED_ALERT_ID = 'device-task-paused';

/** After Stop/Resume is pressed, the machine may still report the old pause for a poll or two. */
const ACTION_GRACE_MS = 3000;

const { PAUSED, PAUSED_FROM_RUNNING, PAUSED_FROM_STARTING } = DeviceConstants.status;

/**
 * Paused with an error means the player stopped to ask the user something (air assist below 50%,
 * filter expired, probe showed, door opened…) and waits for resume or abort, the same states the
 * monitor offers Stop / Resume for. Anything else that carries an error cannot go on.
 */
const resumablePauseStates: ReadonlyArray<number> = [PAUSED, PAUSED_FROM_STARTING, PAUSED_FROM_RUNNING];

export const toErrorList = (error: unknown): string[] => {
  if (!error) return [];

  return (Array.isArray(error) ? error : [error]).filter((e): e is string => typeof e === 'string' && e.length > 0);
};

export const isResumablePause = (stId: number, error: string[]): boolean =>
  resumablePauseStates.includes(stId) && error.length > 0;

const AIR_ASSIST_WARNING = ['HARDWARE_ERROR', 'AIR_ASSIST_OUT_OF_RANGE'];

/** The player paused before starting only because the task's air assist is below 50%. */
export const isAirAssistWarningOnly = (error: string[]): boolean =>
  error.length === AIR_ASSIST_WARNING.length && AIR_ASSIST_WARNING.every((e, i) => error[i] === e);

type MonitorKey = keyof typeof i18n.lang.monitor;

/** Category keys the firmware puts in front of the error details. */
const ERROR_HEADERS: ReadonlyArray<string> = ['HARDWARE_ERROR', 'USER_OPERATION'];

/**
 * Split a firmware error list into one list per category. The list accumulates (player
 * `status.h`), so a category key can show up again mid-list, e.g. `HARDWARE_ERROR,
 * AIR_ASSIST_OUT_OF_RANGE, HARDWARE_ERROR, DOOR_OPENED` or `USER_OPERATION, ROTARY_PAUSE,
 * HARDWARE_ERROR, DOOR_OPENED`, and some details come with no category at all (a limit switch alone
 * reports just `LIMIT_SWITCH_TRIGGERED`); those count as hardware errors.
 */
const splitErrorGroups = (error: string[]): string[][] => {
  const groups: string[][] = [];

  error.forEach((key) => {
    if (ERROR_HEADERS.includes(key)) groups.push([key]);
    else if (groups.length === 0) groups.push(['HARDWARE_ERROR', key]);
    else groups.at(-1)!.push(key);
  });

  return groups;
};

/** Messages for one category: the longest known key from each detail on, e.g. a sub key plus detail. */
const translateErrorGroup = ([main, ...details]: string[]): string[] => {
  const { monitor } = i18n.lang;
  const messages: string[] = [];

  for (let i = 0; i < details.length; ) {
    let next = i + 1;
    let message: string | undefined;

    for (let j = details.length; j > i && !message; j -= 1) {
      message = monitor[[main, ...details.slice(i, j)].join('_') as MonitorKey] as string | undefined;
      next = j;
    }

    // firmware may report the same detail under another category, as DeviceErrorHandler does
    message ??= monitor[`HARDWARE_ERROR_${details[i]}` as MonitorKey] as string | undefined;

    if (message) messages.push(message);

    i = message ? next : i + 1;
  }

  // nothing known in this category: fall back to what the monitor would show for it
  return messages.length > 0 ? messages : [DeviceErrorHandler.translate([main, ...details])];
};

/**
 * DeviceErrorHandler.translate (what the monitor shows) names only the first cause of an accumulated
 * error list. The pause prompt asks the user to act, so translate each cause; a list the monitor
 * already knows as one key, or a single cause, reads the same as in the monitor.
 */
export const translateTaskError = (error: string[]): string => {
  if (error.length === 0) return '';

  const { generic_error: genericError, monitor } = i18n.lang;

  if (genericError[error[0] as keyof typeof genericError] || monitor[error.join('_') as MonitorKey]) {
    return DeviceErrorHandler.translate(error);
  }

  const groups = splitErrorGroups(error).filter((group, _, all) => group.length > 1 || all.length === 1);

  return [...new Set(groups.flatMap(translateErrorGroup))].join('\n\n');
};

export interface TaskPausePrompt {
  /** Close the prompt, e.g. the task was resumed from the machine panel. */
  close: () => void;
  /** Show (or keep showing) the prompt for the pause error the machine reports. */
  show: (error: string[]) => void;
}

/**
 * The Stop / Resume prompt shown while a machine task is paused on an error. The caller keeps polling
 * the report and calls `show` for every poll in a resumable pause and `close` otherwise, so a task
 * resumed or stopped from the machine panel closes the prompt by itself. A pause on the air assist
 * warning alone is resumed without asking, unless the same pause already asked (see `show`).
 */
export const createTaskPausePrompt = ({
  onResume,
  onStop,
}: {
  onResume: () => Promise<unknown>;
  onStop: () => Promise<unknown>;
}): TaskPausePrompt => {
  let shownErrorId: null | string = null;
  let actionAt = 0;
  // Whether this pause has already asked the user; reset once the task is no longer paused.
  let hasAsked = false;

  const dismiss = () => {
    if (shownErrorId === null) return;

    shownErrorId = null;
    Alert.popById(TASK_PAUSED_ALERT_ID);
  };

  const close = () => {
    dismiss();
    hasAsked = false;
  };

  const runAction = (action: () => Promise<unknown>) => async () => {
    shownErrorId = null;
    actionAt = Date.now();

    try {
      await action();
    } catch (err) {
      console.error('Failed to control the paused task', err);
    }
  };

  const show = (error: string[]) => {
    const errorId = error.join('_');

    if (errorId === shownErrorId || Date.now() - actionAt < ACTION_GRACE_MS) return;

    // Software IGNORE_AIR_ASSIST_WARNING for firmware that does not read the metadata yet: the
    // calibration tasks run with air assist off on purpose, so resume the pause without asking.
    // Only when it is the sole error from the start of the pause; air assist plus e.g. an open door
    // asks, and keeps asking after the firmware clears the door error: the user resumes by hand.
    if (isAirAssistWarningOnly(error) && !hasAsked) {
      runAction(onResume)();

      return;
    }

    dismiss();
    shownErrorId = errorId;
    hasAsked = true;

    const { monitor: tMonitor } = i18n.lang;

    Alert.popUp({
      buttonLabels: [tMonitor.stop, tMonitor.resume],
      callbacks: [runAction(onStop), runAction(onResume)],
      id: TASK_PAUSED_ALERT_ID,
      message: translateTaskError(error),
      // Dismissed with Esc: keep the task paused and stop asking about this error; the machine panel
      // can still resume or stop it, and a new error asks again.
      onClose: () => {},
      primaryButtonIndex: 1,
      type: error[0] === 'USER_OPERATION' ? AlertConstants.SHOW_POPUP_INSTRUCTION : AlertConstants.SHOW_POPUP_ERROR,
    });
  };

  return { close, show };
};

/**
 * Tell the user why a machine task failed. A plain abort (Stop here or on the machine) carries no
 * error and is not reported.
 */
export const alertTaskError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : translateTaskError(toErrorList(error));

  if (!message) return;

  Alert.popUpError({ message });
};
