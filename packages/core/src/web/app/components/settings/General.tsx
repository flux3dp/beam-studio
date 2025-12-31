import * as React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';

interface Props {
  changeActiveLang: (val: string) => void;
  supportedLangs: Record<string, string>;
}

function General({ changeActiveLang, supportedLangs }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();
  const langOptions = Object.keys(supportedLangs).map((value) => ({ label: supportedLangs[value], value }));

  return (
    <>
      <SettingSelect
        defaultValue={i18n.getActiveLang()}
        id="select-lang"
        label={lang.settings.language}
        onChange={changeActiveLang}
        options={langOptions}
      />
      {!isWeb() && (
        <SettingSwitch
          checked={getConfig('notification')}
          id="set-notifications"
          label={lang.settings.notifications}
          onChange={(e) => setConfig('notification', e)}
        />
      )}
    </>
  );
}

export default General;
