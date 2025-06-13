import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Engraving({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();
  const reverseEngravingOptions = [
    { label: lang.settings.bottom_up, value: true },
    { label: lang.settings.top_down, value: false },
  ] as unknown as DefaultOptionType[];

  return (
    <>
      <div className="subtitle">{lang.settings.groups.engraving}</div>
      <SettingSelect
        defaultValue={getPreference('fast_gradient')}
        id="set-fast-gradient"
        label={lang.settings.fast_gradient}
        onChange={(e) => setPreference('fast_gradient', e)}
        options={options}
        url={lang.settings.help_center_urls.fast_gradient}
      />
      <SettingSelect
        defaultValue={getPreference('reverse-engraving')}
        id="set-reverse-engraving"
        label={lang.settings.engraving_direction}
        onChange={(e) => setPreference('reverse-engraving', e)}
        options={reverseEngravingOptions}
      />
      <SettingSelect
        defaultValue={getPreference('segmented-engraving')}
        id="set-segmented-engraving"
        label={lang.settings.segmented_engraving}
        onChange={(e) => setPreference('segmented-engraving', e)}
        options={options}
        url={lang.settings.help_center_urls.segmented_engraving}
      />
      {isDev() && (
        <>
          <SettingFormItem id="set-hardware-acceleration" label="Padding Accel">
            <SettingUnitInput
              id="hardware-acceleration"
              max={40000}
              min={1}
              onChange={(val) => setPreference('padding_accel', val)}
              precision={0}
              unit="mm/s^2"
              value={getPreference('padding_accel')}
            />
          </SettingFormItem>
          <SettingFormItem id="set-hardware-acceleration-diode" label="Padding Accel HL">
            <SettingUnitInput
              id="hardware-acceleration-diode"
              max={12000}
              min={1}
              onChange={(val) => setPreference('padding_accel_diode', val)}
              precision={0}
              unit="mm/s^2"
              value={getPreference('padding_accel_diode')}
            />
          </SettingFormItem>
        </>
      )}
    </>
  );
}

export default Engraving;
