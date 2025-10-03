import alertCaller from '@core/app/actions/alert-caller';
import i18n from '@core/helpers/i18n';

export const handleUpdateFinish = (didSuccess: boolean): void => {
  const lang = i18n.lang.update.firmware;

  if (didSuccess) alertCaller.popUp({ message: lang.update_success });
  else alertCaller.popUpError({ message: lang.update_fail });
};
