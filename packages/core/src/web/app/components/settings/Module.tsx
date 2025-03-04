import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import alert from '@core/app/actions/alert-caller';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

const Module = ({ options }: Props): React.JSX.Element => {
  const lang = useI18n();
  const getPreference = useSettingStore((state) => state.getPreference);
  const setPreference = useSettingStore((state) => state.setPreference);
  const getConfig = useSettingStore((state) => state.getConfig);

  const selectedModel = getPreference('model');
  const defaultUnit = getConfig('default-units');
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
      <SettingFormItem id="set_diode_offset_x" label={lang.settings.diode_offset}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getPreference('diode_offset_x')}
          forceUsePropsUnit
          getValue={(val) => setPreference('diode_offset_x', val)}
          id="diode-offset-x-input"
          max={workarea.width}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getPreference('diode_offset_y')}
          forceUsePropsUnit
          getValue={(val) => setPreference('diode_offset_y', val)}
          id="diode-offset-y-input"
          max={workarea.height}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      <SettingSelect
        defaultValue={getPreference('diode-one-way-engraving')}
        id="default-diode"
        label={lang.settings.diode_one_way_engraving}
        onChange={onDiodeOneWayEngravingChanged}
        options={options}
      />
      <SettingFormItem id="set_af-offset" label={lang.settings.autofocus_offset}>
        <UnitInput
          className={{ half: true }}
          defaultValue={getPreference('af-offset')}
          forceUsePropsUnit
          getValue={(val) => setPreference('af-offset', val)}
          id="autofocus-offset-input"
          max={10}
          min={-10}
          step={defaultUnit === 'inches' ? 0.1 : 1}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
    </>
  );
};

export default Module;
