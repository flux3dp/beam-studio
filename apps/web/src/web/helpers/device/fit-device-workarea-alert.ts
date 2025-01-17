import { sprintf } from 'sprintf-js';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import changeWorkarea from 'app/svgedit/operations/changeWorkarea';
import i18n from 'helpers/i18n';
import { IDeviceInfo } from 'interfaces/IDevice';
import { allWorkareas, WorkAreaModel } from 'app/constants/workarea-constants';

const LANG = i18n.lang;

const showResizeAlert = async (device: IDeviceInfo): Promise<boolean> => {
  if (!allWorkareas.has(device.model)) return true;
  return new Promise((resolve) => {
    Alert.popUp({
      message: sprintf(LANG.beambox.popup.change_workarea_before_preview, device.name),
      buttonType: AlertConstants.YES_NO,
      onYes: () => {
        BeamboxPreference.write('model', device.model);
        changeWorkarea(device.model as WorkAreaModel);
        resolve(true);
      },
      onNo: () => resolve(false),
    });
  });
};

export default showResizeAlert;
