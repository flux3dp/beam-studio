import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import i18n from '@core/helpers/i18n';

import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Privacy({ options }: Props): React.JSX.Element {
  const lang = i18n.lang;
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);

  return (
    <>
      <div className="subtitle">{lang.settings.groups.privacy}</div>
      <SettingSelect
        defaultValue={getConfig('enable-sentry')}
        id="set-sentry"
        label={lang.settings.share_with_flux}
        onChange={(e) => setConfig('enable-sentry', e)}
        options={options}
      />
    </>
  );
}

export default Privacy;
