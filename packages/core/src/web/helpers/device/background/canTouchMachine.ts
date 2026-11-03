import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import dialogCaller from '@core/app/actions/dialog-caller';
import DeviceConstants from '@core/app/constants/device-constants';
import deviceMaster from '@core/helpers/device-master';

import type { BackgroundTask } from './types';

import backgroundTasks from './index';

/**
 * Shared check a task runs before it starts busy work on the machine (not a tick gate).
 * False while the user may be using the machine in this app, or the machine itself is not idle.
 */
const canTouchMachine = async (task: BackgroundTask): Promise<boolean> => {
  const blocker = Object.entries({
    // Sub-task, or null = no control socket: getControl() would reconnect with the connecting progress and
    // connection-error alert, so wait for the manager's silent reconnect instead
    controlMode: deviceMaster.currentControlMode ?? 'no socket',
    modal: dialogCaller.hasAnyModal(),
    notCurrent: !backgroundTasks.isCurrent(task),
    preview: previewModeController.isPreviewMode,
    previewStarting: previewModeController.isStarting,
  }).find(([, value]) => value);

  if (blocker) {
    console.log(`[backgroundTasks] ${task.id} cannot touch machine: ${blocker[0]}=${blocker[1]}`);

    return false;
  }

  try {
    const { st_id } = await deviceMaster.getReport();

    if (st_id !== DeviceConstants.status.IDLE) {
      console.log(`[backgroundTasks] ${task.id} cannot touch machine: st_id=${st_id}`);
    }

    return st_id === DeviceConstants.status.IDLE;
  } catch (error) {
    console.warn('[backgroundTasks] getReport failed', error);

    return false;
  }
};

export default canTouchMachine;
