import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

export const hashMap = {
  editor: '#/studio/beambox',
  machineSetup: '#/initialize/connect/select-machine-model',
  root: '#',
  welcome: '#/studio/welcome',
};

export type HashMapKey = keyof typeof hashMap;

export const isAtPage = (page: HashMapKey) => {
  return window.location.hash === hashMap[page];
};

export const checkIsAtEditor = () => {
  if (isAtPage('editor')) {
    return true;
  }

  alertCaller.popUp({
    message: i18n.lang.calibration.please_goto_editor_first,
    type: alertConstants.SHOW_POPUP_INFO,
  });

  return false;
};

export const getHomePage = () => {
  return window.homePage ?? hashMap.welcome;
};
