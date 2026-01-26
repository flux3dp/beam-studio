import alertCaller from '@core/app/actions/alert-caller';
import deviceMaster from '@core/helpers/device-master';
import round from '@core/helpers/math/round';

export const getFocalDistance = async ({ showError = true }: { showError?: boolean } = {}): Promise<number> => {
  let didEnteredRawMode = false;

  try {
    if (deviceMaster.currentControlMode !== 'raw') {
      await deviceMaster.enterRawMode();
      didEnteredRawMode = true;
    }

    const { didAf, z: probeZ } = await deviceMaster.rawGetProbePos();

    if (!didAf) {
      if (showError) alertCaller.popUpError({ message: 'Failed to get material height: not focused' });

      throw new Error('Failed to get material height: not focused');
    }

    const { z: stateZ } = await deviceMaster.rawGetStatePos();

    return round(stateZ - probeZ, 2);
  } finally {
    if (didEnteredRawMode && deviceMaster.currentControlMode === 'raw') {
      await deviceMaster.endSubTask();
    }
  }
};

export default getFocalDistance;
