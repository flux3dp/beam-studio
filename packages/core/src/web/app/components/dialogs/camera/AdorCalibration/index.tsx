import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import { applyCheckpointData, getCheckpointData } from '../common/checkpointData';

import AdorCalibration from './AdorCalibration';
import { calibrateFromDevicePictures } from './utils';

export const showAdorCalibration = async ({
  factoryMode = false,
  isAdvanced = false,
}: { factoryMode?: boolean; isAdvanced?: boolean } = {}): Promise<boolean> => {
  const DIALOG_ID = 'fisheye-calibration-v2';

  if (isIdExist(DIALOG_ID)) {
    return false;
  }

  let currentData: FisheyeCameraParametersV2Cali | null = null;

  if (!isAdvanced) {
    const res = await getCheckpointData<FisheyeCameraParametersV2Cali>({ allowCheckPoint: true });

    if (factoryMode) {
      // Factory: data is optional — CalibrateChessBoard shows a skip button when it exists.
      currentData = res?.data ?? null;
    } else if (res) {
      // Stored params found: upload them and open directly at the put-paper step.
      if (!(await applyCheckpointData(res.data))) {
        return false;
      }

      currentData = res.data;
    } else {
      // No stored params: calibrate from the factory raw photos on the device (saves a checkpoint),
      // or bail out (the helper shows the "no picture found" alert).
      const param = await calibrateFromDevicePictures();

      if (!param || !(await applyCheckpointData(param))) {
        return false;
      }

      currentData = param;
    }
  }

  return new Promise((resolve) => {
    addDialogComponent(
      DIALOG_ID,
      <AdorCalibration
        currentData={currentData}
        factoryMode={factoryMode}
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};
