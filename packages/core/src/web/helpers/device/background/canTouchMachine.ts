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
  if (
    dialogCaller.hasAnyModal() ||
    previewModeController.isPreviewMode ||
    previewModeController.isStarting ||
    deviceMaster.currentControlMode !== '' ||
    !backgroundTasks.isCurrent(task)
  ) {
    return false;
  }

  try {
    const { st_id } = await deviceMaster.getReport();

    return st_id === DeviceConstants.status.IDLE;
  } catch (error) {
    console.warn('[backgroundTasks] getReport failed', error);

    return false;
  }
};

export default canTouchMachine;
