import * as React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

function Update(): null | React.JSX.Element {
  const lang = useI18n();
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);

  if (isWeb()) return null;

  return (
    <>
      <SettingSwitch
        checked={getConfig('auto_check_update')}
        id="set-auto-update"
        label={lang.settings.check_updates}
        onChange={(e) => setConfig('auto_check_update', e)}
      />
    </>
  );
}

export default Update;
