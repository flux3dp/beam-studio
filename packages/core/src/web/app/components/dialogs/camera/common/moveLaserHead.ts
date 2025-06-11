import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

const moveLaserHead = async (position?: [number, number]): Promise<boolean> => {
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
      const { cameraCenter, height, width } = getWorkarea(device.info.model as WorkAreaModel, 'fbb2');

      position = (cameraCenter as [number, number]) ?? [width / 2, height / 2];
    }

    await deviceMaster.rawMove({ f: 7500, x: position[0], y: position[1] });
    await deviceMaster.rawEndLineCheckMode();
    isLineCheckMode = false;
    await deviceMaster.rawLooseMotor();
    await deviceMaster.endSubTask();

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

        await deviceMaster.rawLooseMotor();
        await deviceMaster.endSubTask();
      }
    } finally {
      progressCaller.popById('move-laser-head');
    }
  }
};

export default moveLaserHead;
