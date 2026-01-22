import React from 'react';

import alert from '@core/app/actions/alert-caller';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import useI18n from '@core/helpers/useI18n';

import {
  SettingFormItem,
  SettingSwitch,
  SettingUnitInput,
  type SettingUnitInputProps,
  useSettingStore,
  XYItem,
} from '../../shared';

interface Props {
  unitInputProps: Partial<SettingUnitInputProps>;
}

const BeamoSettings = ({ unitInputProps }: Props): React.JSX.Element => {
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
      <SettingSwitch
        checked={getPreference('default-borderless')}
        id="default-open-bottom"
        label={lang.settings.default_borderless_mode}
        onChange={(e) => setPreference('default-borderless', e)}
        url={lang.settings.help_center_urls.default_borderless_mode}
      />
      <SettingSwitch
        checked={getPreference('default-autofocus')}
        id="default-autofocus"
        label={lang.settings.default_enable_autofocus_module}
        onChange={(e) => setPreference('default-autofocus', e)}
        url={lang.settings.help_center_urls.default_enable_autofocus_module}
      />
      <SettingSwitch
        checked={getPreference('default-diode')}
        id="default-diode"
        label={lang.settings.default_enable_diode_module}
        onChange={(e) => setPreference('default-diode', e)}
        url={lang.settings.help_center_urls.default_enable_diode_module}
      />
      <XYItem
        id="set_diode_offset"
        label={lang.settings.diode_offset}
        maxX={workarea.width}
        maxY={workarea.height}
        minX={0}
        minY={0}
        onChange={(axis, val) => setPreference(`diode_offset_${axis}`, val)}
        tooltip={lang.settings.engraving_offset_tooltip}
        unitInputProps={unitInputProps}
        values={[getPreference('diode_offset_x'), getPreference('diode_offset_y')]}
      />
      <SettingSwitch
        checked={getPreference('diode-one-way-engraving')}
        id="diode-one-way-engraving"
        label={lang.settings.diode_one_way_engraving}
        onChange={onDiodeOneWayEngravingChanged}
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

export default BeamoSettings;
