import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { workAreaSet } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const showResizeAlert = async (device: IDeviceInfo): Promise<boolean> => {
  if (!workAreaSet.has(device.model)) {
    return true;
  }

  return new Promise((resolve) => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      message: sprintf(i18n.lang.beambox.popup.change_workarea_before_preview, device.name),
      onNo: () => resolve(false),
      onYes: () => {
        useGlobalPreferenceStore.getState().set('model', device.model);
        changeWorkarea(device.model as WorkAreaModel);
        resolve(true);
      },
    });
  });
};

export default showResizeAlert;
