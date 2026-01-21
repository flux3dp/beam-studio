import React from 'react';

import useI18n from '@core/helpers/useI18n';

import { SettingSwitch, useSettingStore } from '../../shared';

function BB2Settings(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <SettingSwitch
      checked={getPreference('curve_engraving_speed_limit')}
      id="set-curve-engraving-speed-contraint"
      label={lang.settings.curve_engraving_speed_limit}
      onChange={(e) => setPreference('curve_engraving_speed_limit', e)}
    />
  );
}

export default BB2Settings;
