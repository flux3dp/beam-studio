import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

interface Props {
  options: DefaultOptionType[];
}

function Privacy({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.privacy}</div>
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
