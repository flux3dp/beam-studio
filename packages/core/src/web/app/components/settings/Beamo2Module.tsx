import React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

const Beamo2Module = (): React.JSX.Element => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <>
      <SettingSwitch
        checked={getPreference('use-union-boundary')}
        id="use-union-boundary"
        label={lang.settings.use_union_boundary}
        onChange={(e) => setPreference('use-union-boundary', e)}
        tooltip={lang.settings.use_union_boundary_tooltip}
      />
    </>
  );
};

export default Beamo2Module;
