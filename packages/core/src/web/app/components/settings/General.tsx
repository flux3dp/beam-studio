import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';

import SettingSelect from './components/SettingSelect';
interface Props {
  changeActiveLang: (val: string) => void;
  options: DefaultOptionType[];
  supportedLangs: Record<string, string>;
}

function General({ changeActiveLang, options, supportedLangs }: Props): React.JSX.Element {
  const { lang } = i18n;
  const langOptions = Object.keys(supportedLangs).map((value) => ({ label: supportedLangs[value], value }));
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);
  // const defaultValue = options.find(({ value }) => value === getConfig('notification'))?.value as string;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.general}</div>

      <SettingSelect
        defaultValue={i18n.getActiveLang()}
        id="select-lang"
        label={lang.settings.language}
        onChange={changeActiveLang}
        options={langOptions}
      />
      {isWeb() ? null : (
        <SettingSelect
          defaultValue={getConfig('notification')}
          id="set-notifications"
          label={lang.settings.notifications}
          onChange={(e) => setConfig('notification', e)}
          options={options}
        />
      )}
    </>
  );
}

export default General;
