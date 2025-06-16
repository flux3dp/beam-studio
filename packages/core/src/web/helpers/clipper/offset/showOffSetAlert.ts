import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

export function showOffsetAlert(type: 'failed' | 'unsupported') {
  const messages = {
    failed: i18n.lang.beambox.tool_panels._offset.fail_message,
    unsupported: i18n.lang.beambox.tool_panels._offset.not_support_message,
  };

  alertCaller.popUp({ id: `offset-${type}-alert`, message: messages[type], type: alertConstants.SHOW_POPUP_WARNING });
}
