import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

interface Options {
  found: number;
  /** go to the manual steps, with the marks that were found as the starting points */
  onManual: () => void;
  total: number;
}

/**
 * The automatic step could not find every mark: say how many it found and offer the manual steps. Move the dialog
 * to the step it should rest on BEFORE calling this, as with showHighResidualAlert.
 */
const showNotEnoughMarksAlert = ({ found, onManual, total }: Options): void => {
  const { alert, calibration: t } = i18n.lang;

  alertCaller.popUp({
    buttons: [
      { label: alert.cancel, onClick: () => {} },
      { label: t.auto_solve_pnp_calibrate_manually, onClick: onManual, type: 'primary' },
    ],
    message: sprintf(t.auto_solve_pnp_not_enough_marks, { found, total }),
    type: alertConstants.SHOW_POPUP_ERROR,
  });
};

export default showNotEnoughMarksAlert;
