import * as React from 'react';

import alert from 'app/actions/alert-caller';
import Controls from 'app/components/settings/Control';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { OptionValues } from 'app/constants/enums';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';

interface Props {
  defaultUnit: string;
  selectedModel: WorkAreaModel;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
}

const Module = ({
  defaultUnit,
  selectedModel,
  getBeamboxPreferenceEditingValue,
  updateBeamboxPreferenceChange,
}: Props): JSX.Element => {
  const lang = useI18n();
  const workarea = getWorkarea(selectedModel);
  const diodeOffsetX = getBeamboxPreferenceEditingValue('diode_offset_x');
  const diodeOffsetY = getBeamboxPreferenceEditingValue('diode_offset_y');
  const autofocusOffset = getBeamboxPreferenceEditingValue('af-offset');

  const defaultBorderless = getBeamboxPreferenceEditingValue('default-borderless');
  const borderlessModeOptions = onOffOptionFactory(defaultBorderless, { lang });
  const defaultAf = getBeamboxPreferenceEditingValue('default-autofocus');
  const autofocusModuleOptions = onOffOptionFactory(defaultAf, { lang });
  const defaultDiode = getBeamboxPreferenceEditingValue('default-diode');
  const diodeModuleOptions = onOffOptionFactory(defaultDiode, { lang });
  const diodeOneWay = getBeamboxPreferenceEditingValue('diode-one-way-engraving') !== false;
  const diodeOneWayEngravingOpts = onOffOptionFactory(diodeOneWay);

  const onDiodeOneWayEngravingChanged = (e) => {
    if (e.target.value === OptionValues.FALSE) {
      alert.popUp({ message: lang.settings.diode_two_way_warning });
    }
    updateBeamboxPreferenceChange('diode-one-way-engraving', e.target.value);
  };

  return (
    <>
      <div className="subtitle">{lang.settings.groups.modules}</div>
      <SelectControl
        label={lang.settings.default_borderless_mode}
        url={lang.settings.help_center_urls.default_borderless_mode}
        id="default-open-bottom"
        options={borderlessModeOptions}
        onChange={(e) => updateBeamboxPreferenceChange('default-borderless', e.target.value)}
      />
      <SelectControl
        label={lang.settings.default_enable_autofocus_module}
        url={lang.settings.help_center_urls.default_enable_autofocus_module}
        id="default-autofocus"
        options={autofocusModuleOptions}
        onChange={(e) => updateBeamboxPreferenceChange('default-autofocus', e.target.value)}
      />
      <SelectControl
        label={lang.settings.default_enable_diode_module}
        url={lang.settings.help_center_urls.default_enable_diode_module}
        id="default-diode"
        options={diodeModuleOptions}
        onChange={(e) => updateBeamboxPreferenceChange('default-diode', e.target.value)}
      />
      <Controls label={lang.settings.diode_offset}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="diode-offset-x-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={0}
          max={workarea.width}
          defaultValue={diodeOffsetX || 0}
          getValue={(val) => updateBeamboxPreferenceChange('diode_offset_x', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="diode-offset-y-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={0}
          max={workarea.height}
          defaultValue={diodeOffsetY || 0}
          getValue={(val) => updateBeamboxPreferenceChange('diode_offset_y', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      <SelectControl
        label={lang.settings.diode_one_way_engraving}
        id="default-diode"
        options={diodeOneWayEngravingOpts}
        onChange={onDiodeOneWayEngravingChanged}
      />
      <Controls label={lang.settings.autofocus_offset}>
        <UnitInput
          id="autofocus-offset-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-10}
          max={10}
          defaultValue={autofocusOffset || 0}
          step={defaultUnit === 'inches' ? 0.1 : 1}
          getValue={(val) => updateBeamboxPreferenceChange('af-offset', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
    </>
  );
};

export default Module;
