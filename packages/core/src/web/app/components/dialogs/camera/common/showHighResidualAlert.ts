import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

interface Options {
  /** whether the dialog already runs in advanced mode, where the intrinsics were just measured */
  isAdvanced: boolean;
  /** go on with the points that were found */
  onContinue: () => void;
  /** advanced mode only: back to the calibration pattern capture */
  onRecapture: () => void;
  /** basic mode only: close the dialog and open the advanced calibration; release the machine first */
  onSwitchToAdvanced: () => void;
}

/**
 * The automatic step found every mark but they fit the camera parameters poorly: let the user go on, or redo the
 * intrinsics. Move the dialog to the step it should rest on BEFORE calling this: the alert can be dismissed with
 * Esc, and a ProcessingDialog left mounted behind it runs its process again on a re-render.
 */
const showHighResidualAlert = ({ isAdvanced, onContinue, onRecapture, onSwitchToAdvanced }: Options): void => {
  const { calibration: t, topbar } = i18n.lang;

  alertCaller.popUp({
    buttons: [
      { label: t.auto_solve_pnp_continue_anyway, onClick: onContinue },
      isAdvanced
        ? { label: t.title_capture_calibration_pattern, onClick: onRecapture, type: 'primary' }
        : { label: topbar.menu.calibrate_camera_advanced, onClick: onSwitchToAdvanced, type: 'primary' },
    ],
    message: isAdvanced ? t.auto_solve_pnp_high_residual_advanced : t.auto_solve_pnp_high_residual,
    type: alertConstants.SHOW_POPUP_WARNING,
  });
};

export default showHighResidualAlert;
