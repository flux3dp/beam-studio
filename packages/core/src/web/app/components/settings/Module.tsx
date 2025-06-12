import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import alert from '@core/app/actions/alert-caller';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import XYItem from '@core/app/components/settings/components/XYItem';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
  unitInputProps: Partial<SettingUnitInputProps>;
}

const Module = ({ options, unitInputProps }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();
  const selectedModel = getPreference('model');
  const workarea = getWorkarea(selectedModel);
  const onDiodeOneWayEngravingChanged = (e: boolean) => {
    if (e === false) {
      alert.popUp({ message: lang.settings.diode_two_way_warning });
    }

    setPreference('diode-one-way-engraving', e);
  };

  return (
    <>
      <div className="subtitle">{lang.settings.groups.modules}</div>
      <SettingSelect
        defaultValue={getPreference('default-borderless')}
        id="default-open-bottom"
        label={lang.settings.default_borderless_mode}
        onChange={(e) => setPreference('default-borderless', e)}
        options={options}
        url={lang.settings.help_center_urls.default_borderless_mode}
      />
      <SettingSelect
        defaultValue={getPreference('default-autofocus')}
        id="default-autofocus"
        label={lang.settings.default_enable_autofocus_module}
        onChange={(e) => setPreference('default-autofocus', e)}
        options={options}
        url={lang.settings.help_center_urls.default_enable_autofocus_module}
      />
      <SettingSelect
        defaultValue={getPreference('default-diode')}
        id="default-diode"
        label={lang.settings.default_enable_diode_module}
        onChange={(e) => setPreference('default-diode', e)}
        options={options}
        url={lang.settings.help_center_urls.default_enable_diode_module}
      />
      <XYItem
        id="set_diode_offset_x"
        label={lang.settings.diode_offset}
        maxX={workarea.width}
        maxY={workarea.height}
        minX={0}
        minY={0}
        onChange={(axis, val) => setPreference(`diode_offset_${axis}`, val)}
        unitInputProps={unitInputProps}
        values={[getPreference('diode_offset_x'), getPreference('diode_offset_y')]}
      />
      <SettingSelect
        defaultValue={getPreference('diode-one-way-engraving')}
        id="default-diode"
        label={lang.settings.diode_one_way_engraving}
        onChange={onDiodeOneWayEngravingChanged}
        options={options}
      />
      <SettingFormItem id="set_af-offset" label={lang.settings.autofocus_offset}>
        <SettingUnitInput
          {...unitInputProps}
          id="autofocus-offset-input"
          max={10}
          min={-10}
          onChange={(val) => setPreference('af-offset', val)}
          value={getPreference('af-offset')}
        />
      </SettingFormItem>
    </>
  );
};

export default Module;
