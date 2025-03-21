import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import { checkConnection } from '@core/helpers/api/discover';
import fileExportHelper from '@core/helpers/file-export-helper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';

const webNeedConnectionWrapper = <T>(callback: () => Promise<T> | T): Promise<T> | T => {
  if (isWeb() && !checkConnection()) {
    alertCaller.popUp({
      buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
      buttonType: alertConstants.CUSTOM_CANCEL,
      callbacks: async () => {
        ObjectPanelController.updateActiveKey(null);

        const res = await fileExportHelper.toggleUnsavedChangedDialog();

        if (res) {
          window.location.hash = '#/initialize/connect/select-machine-model';
        }
      },
      caption: i18n.lang.alert.oops,
      message: i18n.lang.device_selection.no_device_web,
    });

    return null;
  }

  return callback();
};

export default webNeedConnectionWrapper;
