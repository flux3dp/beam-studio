import * as React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

function Privacy(): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();

  return (
    <>
      <SettingSwitch
        checked={getConfig('enable-sentry')}
        id="set-sentry"
        label={lang.settings.share_with_flux}
        onChange={(e) => setConfig('enable-sentry', e)}
      />
    </>
  );
}

export default Privacy;
