import deviceMaster from '@core/helpers/device-master';

export const moveZRel = async (z: number) => {
  try {
    await deviceMaster.enterRawMode();
    await deviceMaster.rawMoveZRel(z);
    await deviceMaster.endSubTask();

    const zSpeed = 2.33; // 140 mm/min

    await new Promise((resolve) => setTimeout(resolve, (Math.abs(z) / zSpeed) * 1000));
  } finally {
    if (deviceMaster.currentControlMode === 'raw') {
      await deviceMaster.endSubTask();
    }
  }
};

export default moveZRel;
