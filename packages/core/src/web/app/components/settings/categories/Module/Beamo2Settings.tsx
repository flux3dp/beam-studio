import React from 'react';

import useI18n from '@core/helpers/useI18n';

import { SettingSwitch, useSettingStore } from '../../shared';

function Beamo2Settings(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <SettingSwitch
      checked={getPreference('use-union-boundary')}
      id="use-union-boundary"
      label={lang.settings.use_union_boundary}
      onChange={(e) => setPreference('use-union-boundary', e)}
      tooltip={lang.settings.use_union_boundary_tooltip}
    />
  );
}

export default Beamo2Settings;
