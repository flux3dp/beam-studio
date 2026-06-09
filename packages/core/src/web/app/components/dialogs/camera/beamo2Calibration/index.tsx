import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import i18n from '@core/helpers/i18n';
import type { FisheyeCameraParametersV4Cali } from '@core/interfaces/FisheyePreview';

import { applyCheckpointData, getCheckpointData } from '../common/checkpointData';

import Beamo2Calibration from './Beamo2Calibration';

export const showBeamo2Calibration = async (isAdvanced = false): Promise<boolean> => {
  const id = 'bm2-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) onClose();

  let currentData: FisheyeCameraParametersV4Cali | undefined;

  if (!isAdvanced) {
    const res = await getCheckpointData<FisheyeCameraParametersV4Cali>({ allowCheckPoint: false });

    if (!res || !(await applyCheckpointData(res.data))) {
      alertCaller.popUpError({
        buttons: [
          { isLeft: true, label: i18n.lang.alert.cancel },
          {
            label: i18n.lang.topbar.menu.calibrate_camera_advanced,
            onClick: () => showBeamo2Calibration(true),
            type: 'primary',
          },
        ],
        message: i18n.lang.calibration.unable_to_load_camera_parameters,
      });

      return false;
    }

    currentData = res.data;
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <Beamo2Calibration
        currentData={currentData}
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export default {
  showBeamo2Calibration,
};
