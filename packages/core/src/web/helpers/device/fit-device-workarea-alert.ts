import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import AlertConstants from '@core/app/constants/alert-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { allWorkareas } from '@core/app/constants/workarea-constants';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const LANG = i18n.lang;

const showResizeAlert = async (device: IDeviceInfo): Promise<boolean> => {
  if (!allWorkareas.has(device.model)) {
    return true;
  }

  return new Promise((resolve) => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      message: sprintf(LANG.beambox.popup.change_workarea_before_preview, device.name),
      onNo: () => resolve(false),
      onYes: () => {
        BeamboxPreference.write('model', device.model);
        changeWorkarea(device.model as WorkAreaModel);
        resolve(true);
      },
    });
  });
};

export default showResizeAlert;
