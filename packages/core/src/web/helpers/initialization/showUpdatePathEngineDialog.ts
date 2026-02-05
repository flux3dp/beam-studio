import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import tabController from '@core/app/actions/tabController';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

import { hasSwiftray } from '../api/swiftray-client';
import i18n from '../i18n';
import isWeb from '../is-web';

const showUpdatePathEngineDialog = async (isNewUser: boolean): Promise<void> => {
  if (isWeb() || !hasSwiftray || !tabController.getIsFirstTab()) return;

  const globalPreference = useGlobalPreferenceStore.getState();

  if (isNewUser) {
    globalPreference.set('path-engine-dialog-shown', true);
    globalPreference.set('path-engine', 'swiftray');

    return;
  }

  if (globalPreference['path-engine-dialog-shown'] || globalPreference['path-engine'] === 'swiftray') return;

  const { lang } = i18n;

  await new Promise<void>((resolve) => {
    alertCaller.popUp({
      buttons: [
        {
          label: lang.global.enable,
          onClick: () => {
            globalPreference.set('path-engine', 'swiftray');
            resolve();
          },
          type: 'primary',
        },
        {
          label: lang.beambox.popup.path_engine_upgrade.keep_current,
          onClick: () => resolve(),
        },
      ],
      caption: lang.beambox.popup.path_engine_upgrade.caption,
      message: sprintf(lang.beambox.popup.path_engine_upgrade.message, {
        editor: lang.settings.groups.editor,
        path_acceleration: lang.settings.calculation_optimization,
        preferences: lang.topbar.menu.preferences,
      }),
    });
  });
  globalPreference.set('path-engine-dialog-shown', true);
};

export default showUpdatePathEngineDialog;
