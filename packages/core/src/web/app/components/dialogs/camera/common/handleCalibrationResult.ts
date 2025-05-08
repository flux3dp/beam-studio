import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import i18n from '@core/helpers/i18n';

const handleCalibrationResult = async (retScore: number, goodThreshold = 1, averageThreshold = 2): Promise<boolean> => {
  const tCali = i18n.lang.calibration;
  const res = await new Promise<boolean>((resolve) => {
    let rank = tCali.res_excellent;

    if (retScore > averageThreshold) rank = tCali.res_poor;
    else if (retScore > goodThreshold) rank = tCali.res_average;

    alertCaller.popUp({
      buttons: [
        { className: 'primary', label: tCali.next, onClick: () => resolve(true) },
        { label: tCali.cancel, onClick: () => resolve(false) },
      ],
      message: sprintf(tCali.calibrate_success_msg, rank, retScore),
    });
  });

  return res;
};

export default handleCalibrationResult;
