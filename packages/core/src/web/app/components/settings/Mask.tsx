import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Mask({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const getPreference = useSettingStore((state) => state.getPreference);
  const setPreference = useSettingStore((state) => state.setPreference);

  return (
    <>
      <div className="subtitle">{lang.settings.groups.mask}</div>
      <SettingSelect
        defaultValue={getPreference('enable_mask')}
        id="set-mask"
        label={lang.settings.mask}
        onChange={(e) => setPreference('enable_mask', e)}
        options={options}
        url={lang.settings.help_center_urls.mask}
      />
    </>
  );
}

export default Mask;
