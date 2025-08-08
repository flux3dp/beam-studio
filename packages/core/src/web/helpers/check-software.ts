import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { adorModels } from '@core/app/actions/beambox/constant';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import versionCompare from './version-compare';

export default function checkSoftwareForAdor(device: IDeviceInfo, show_alert = true): boolean {
  const { version } = window.FLUX;
  const { model } = device;

  if (!isWeb() && versionCompare(version, '2.2') && adorModels.has(model)) {
    if (show_alert) {
      alertCaller.popUp({
        buttonType: alertConstants.SHOW_POPUP_INFO,
        message: sprintf(i18n.lang.update.software.update_for_ador, version),
      });
    }

    return false;
  }

  return true;
}
