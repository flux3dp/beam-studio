import alertCaller from '@core/app/actions/alert-caller';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import alertConstants from '@core/app/constants/alert-constants';
import { discoverManager } from '@core/helpers/api/discover';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';

import { hashMap } from './hashHelper';

const webNeedConnectionWrapper = <T>(callback: () => Promise<T> | T): Promise<T> | T => {
  if (isWeb() && !discoverManager.checkConnection()) {
    alertCaller.popUp({
      buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
      buttonType: alertConstants.CUSTOM_CANCEL,
      callbacks: async () => {
        ObjectPanelController.updateActiveKey(null);

        if (await toggleUnsavedChangedDialog()) {
          window.location.hash = hashMap.machineSetup;
        }
      },
      caption: i18n.lang.alert.oops,
      message: i18n.lang.device_selection.no_device_web,
    });

    return null as T;
  }

  return callback();
};

export default webNeedConnectionWrapper;
