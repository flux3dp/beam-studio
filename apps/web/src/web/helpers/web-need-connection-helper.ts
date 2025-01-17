import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import fileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';

import { checkConnection } from 'helpers/api/discover';

const webNeedConnectionWrapper = <T>(callback: () => T | Promise<T>): T | Promise<T> => {
  if (isWeb() && !checkConnection()) {
    alertCaller.popUp({
      caption: i18n.lang.alert.oops,
      message: i18n.lang.device_selection.no_device_web,
      buttonType: alertConstants.CUSTOM_CANCEL,
      buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
      callbacks: async () => {
        ObjectPanelController.updateActiveKey(null);
        const res = await fileExportHelper.toggleUnsavedChangedDialog();
        if (res) window.location.hash = '#initialize/connect/select-machine-model';
      },
    });
    return null;
  }
  return callback();
};

export default webNeedConnectionWrapper;
