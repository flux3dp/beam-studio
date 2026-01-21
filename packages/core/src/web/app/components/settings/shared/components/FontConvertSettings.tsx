import React from 'react';

import useI18n from '@core/helpers/useI18n';

import { useSettingStore } from '../hooks/useSettingStore';

import SettingSelect from './SettingSelect';
import SettingSwitch from './SettingSwitch';

const fontConvertOptions = [
  { label: '1.0', value: '1.0' },
  { label: '2.0', value: '2.0' },
];

function FontConvertSettings(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  return (
    <>
      <SettingSwitch
        checked={getPreference('font-substitute')}
        id="font-substitue"
        label={lang.settings.font_substitute}
        onChange={(e) => setPreference('font-substitute', e)}
        url={lang.settings.help_center_urls.font_substitute}
      />
      <SettingSelect
        defaultValue={getPreference('font-convert')}
        id="font-convert"
        label={lang.settings.font_convert}
        onChange={(e) => setPreference('font-convert', e)}
        options={fontConvertOptions}
        url={lang.settings.help_center_urls.font_convert}
      />
    </>
  );
}

export default FontConvertSettings;
