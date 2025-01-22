import * as React from 'react';

import alert from '@core/app/actions/alert-caller';
import Controls from '@core/app/components/settings/Control';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import { OptionValues } from '@core/app/constants/enums';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import useI18n from '@core/helpers/useI18n';

interface Props {
  defaultUnit: string;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  selectedModel: WorkAreaModel;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
}

const Module = ({
  defaultUnit,
  getBeamboxPreferenceEditingValue,
  selectedModel,
  updateBeamboxPreferenceChange,
}: Props): React.JSX.Element => {
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
        id="default-open-bottom"
        label={lang.settings.default_borderless_mode}
        onChange={(e) => updateBeamboxPreferenceChange('default-borderless', e.target.value)}
        options={borderlessModeOptions}
        url={lang.settings.help_center_urls.default_borderless_mode}
      />
      <SelectControl
        id="default-autofocus"
        label={lang.settings.default_enable_autofocus_module}
        onChange={(e) => updateBeamboxPreferenceChange('default-autofocus', e.target.value)}
        options={autofocusModuleOptions}
        url={lang.settings.help_center_urls.default_enable_autofocus_module}
      />
      <SelectControl
        id="default-diode"
        label={lang.settings.default_enable_diode_module}
        onChange={(e) => updateBeamboxPreferenceChange('default-diode', e.target.value)}
        options={diodeModuleOptions}
        url={lang.settings.help_center_urls.default_enable_diode_module}
      />
      <Controls label={lang.settings.diode_offset}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={diodeOffsetX || 0}
          forceUsePropsUnit
          getValue={(val) => updateBeamboxPreferenceChange('diode_offset_x', val)}
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
          defaultValue={diodeOffsetY || 0}
          forceUsePropsUnit
          getValue={(val) => updateBeamboxPreferenceChange('diode_offset_y', val)}
          id="diode-offset-y-input"
          max={workarea.height}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      <SelectControl
        id="default-diode"
        label={lang.settings.diode_one_way_engraving}
        onChange={onDiodeOneWayEngravingChanged}
        options={diodeOneWayEngravingOpts}
      />
      <Controls label={lang.settings.autofocus_offset}>
        <UnitInput
          className={{ half: true }}
          defaultValue={autofocusOffset || 0}
          forceUsePropsUnit
          getValue={(val) => updateBeamboxPreferenceChange('af-offset', val)}
          id="autofocus-offset-input"
          max={10}
          min={-10}
          step={defaultUnit === 'inches' ? 0.1 : 1}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
    </>
  );
};

export default Module;
