import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

interface Props {
  options: DefaultOptionType[];
}

const BB2Settings = ({ options }: Props): React.ReactNode => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <>
      <div className={styles.subtitle}>Beambox II</div>
      <SettingSelect
        defaultValue={getPreference('curve_engraving_speed_limit')}
        id="set-curve-engraving-speed-contraint"
        label={lang.settings.curve_engraving_speed_limit}
        onChange={(e) => setPreference('curve_engraving_speed_limit', e)}
        options={options}
      />
    </>
  );
};

export default BB2Settings;
