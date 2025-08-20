import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

interface Props {
  options: DefaultOptionType[];
}

function Update({ options }: Props): null | React.JSX.Element {
  const lang = useI18n();
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);

  if (isWeb()) return null;

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.update}</div>
      <SettingSelect
        defaultValue={getConfig('auto_check_update')}
        id="set-auto-update"
        label={lang.settings.check_updates}
        onChange={(e) => setConfig('auto_check_update', e)}
        options={options}
      />
    </>
  );
}

export default Update;
