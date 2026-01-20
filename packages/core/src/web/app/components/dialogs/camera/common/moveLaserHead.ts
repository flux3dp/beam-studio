import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

const moveLaserHead = async (
  position?: [number, number],
  {
    shouldKeepPosition = false,
    zMove,
  }: { shouldKeepPosition?: boolean; zMove?: { ref?: 'cur' | 'home'; val: number } } = {},
): Promise<boolean> => {
  let isLineCheckMode = false;
  const lang = i18n.lang.calibration;

  try {
    progressCaller.openNonstopProgress({
      id: 'move-laser-head',
      message: lang.moving_laser_head,
    });

    const device = deviceMaster.currentDevice;

    await deviceMaster.enterRawMode();
    await deviceMaster.rawHome();
    await deviceMaster.rawStartLineCheckMode();
    isLineCheckMode = true;

    if (!position) {
      const { cameraCenter, height, width } = getWorkarea(device?.info.model as WorkAreaModel, 'fbb2');

      position = cameraCenter ?? [width / 2, height / 2];
    }

    await deviceMaster.rawMove({ f: 7500, x: position[0], y: position[1] });

    const dist = (position[0] ** 2 + position[1] ** 2) ** 0.5;
    const time = (dist / (7500 / 60)) * 2; // safety factor 2

    await new Promise((resolve) => setTimeout(resolve, time * 1000));

    if (zMove) {
      const { ref = 'cur', val } = zMove;

      if (ref === 'home') await deviceMaster.rawMoveZRelToLastHome(val);
      else if (val !== 0) await deviceMaster.rawMoveZRel(val);
    }

    await deviceMaster.rawEndLineCheckMode();
    isLineCheckMode = false;

    if (!shouldKeepPosition) {
      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    }

    return true;
  } catch (error) {
    console.error(error);
    alertCaller.popUpError({ message: lang.failed_to_move_laser_head });

    return false;
  } finally {
    try {
      if (deviceMaster.currentControlMode === 'raw') {
        if (isLineCheckMode) {
          await deviceMaster.rawEndLineCheckMode();
        }

        if (!shouldKeepPosition) {
          await deviceMaster.rawLooseMotor();
          await deviceMaster.endSubTask();
        }
      }
    } finally {
      progressCaller.popById('move-laser-head');
    }
  }
};

export default moveLaserHead;
