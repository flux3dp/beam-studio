import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import SettingSelect from '@core/app/components/settings/components/SettingSelect';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import styles from './Settings.module.scss';

interface Props {
  options: DefaultOptionType[];
}

const Beamo2Module = ({ options }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.beamo2_modules}</div>
      <SettingSelect
        defaultValue={getPreference('use-union-boundary')}
        id="use-union-boundary"
        label={lang.settings.use_union_boundary}
        onChange={(e) => setPreference('use-union-boundary', e)}
        options={options}
        tooltip={lang.settings.use_union_boundary_tooltip}
      />
    </>
  );
};

export default Beamo2Module;
