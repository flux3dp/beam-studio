import alertCaller from 'app/actions/alert-caller';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import progressCaller from 'app/actions/progress-caller';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';

const moveLaserHead = async (): Promise<boolean> => {
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
    const { width, height, cameraCenter } = getWorkarea(device.info.model as WorkAreaModel, 'fbb2');
    const center = cameraCenter ?? [width / 2, height / 2];
    await deviceMaster.rawMove({ x: center[0], y: center[1], f: 7500 });
    await deviceMaster.rawEndLineCheckMode();
    isLineCheckMode = false;
    await deviceMaster.rawLooseMotor();
    await deviceMaster.endRawMode();
    return true;
  } catch (error) {
    console.error(error);
    alertCaller.popUpError({ message: lang.failed_to_move_laser_head });
    return false;
  } finally {
    try {
      if (deviceMaster.currentControlMode === 'raw') {
        if (isLineCheckMode) await deviceMaster.rawEndLineCheckMode();
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endRawMode();
      }
    } finally {
      progressCaller.popById('move-laser-head');
    }
  }
};

export default moveLaserHead;
