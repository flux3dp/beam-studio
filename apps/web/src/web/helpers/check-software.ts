import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import { IDeviceInfo } from 'interfaces/IDevice';
import { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import { sprintf } from 'sprintf-js';

import versionCompare from './version-compare';

export default function checkSoftwareForAdor(device: IDeviceInfo, show_alert = true): boolean {
  const { version } = window.FLUX;
  const { model } = device;
  if (!isWeb() && versionCompare(version, '2.2') && modelsWithModules.has(model)) {
    if (show_alert) {
      alertCaller.popUp({
        message: sprintf(i18n.lang.update.software.update_for_ador, version),
        buttonType: alertConstants.SHOW_POPUP_INFO,
      });
    }
    return false;
  }
  return true;
}
