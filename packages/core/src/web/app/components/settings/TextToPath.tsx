import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function TextToPath({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const getPreference = useSettingStore((state) => state.getPreference);
  const setPreference = useSettingStore((state) => state.setPreference);
  const defaultLaserModuleOptions = [
    { label: '1.0', value: '1.0' },
    { label: '2.0', value: '2.0' },
  ];

  return (
    <>
      <div className="subtitle">{lang.settings.groups.text_to_path}</div>
      <SettingSelect
        defaultValue={getPreference('font-substitute')}
        id="font-substitue"
        label={lang.settings.font_substitute}
        onChange={(e) => setPreference('font-substitute', e)}
        options={options}
        url={lang.settings.help_center_urls.font_substitute}
      />
      <SettingSelect
        defaultValue={getPreference('font-convert')}
        id="font-convert"
        label={lang.settings.font_convert}
        onChange={(e) => setPreference('font-convert', e)}
        options={defaultLaserModuleOptions}
        url={lang.settings.help_center_urls.font_convert}
      />
    </>
  );
}

export default TextToPath;
