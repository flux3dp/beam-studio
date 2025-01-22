import React from 'react';

import Controls from '@core/app/components/settings/Control';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

interface Props {
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Engraving({ getBeamboxPreferenceEditingValue, updateBeamboxPreferenceChange }: Props): React.JSX.Element {
  const lang = useI18n();
  const fastGradientOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('fast_gradient') !== false, { lang });

  const reverseEngravingOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('reverse-engraving'), {
    lang,
    offLabel: lang.settings.top_down,
    onLabel: lang.settings.bottom_up,
  });

  return (
    <>
      <div className="subtitle">{lang.settings.groups.engraving}</div>
      <SelectControl
        id="set-fast-gradient"
        label={lang.settings.fast_gradient}
        onChange={(e) => updateBeamboxPreferenceChange('fast_gradient', e.target.value)}
        options={fastGradientOptions}
        url={lang.settings.help_center_urls.fast_gradient}
      />
      <SelectControl
        id="set-reverse-engraving"
        label={lang.settings.engraving_direction}
        onChange={(e) => updateBeamboxPreferenceChange('reverse-engraving', e.target.value)}
        options={reverseEngravingOptions}
      />
      {isDev() && (
        <>
          <Controls label="Padding Accel">
            <UnitInput
              className={{ half: true }}
              decimal={0}
              defaultValue={getBeamboxPreferenceEditingValue('padding_accel') || 5000}
              getValue={(val) => updateBeamboxPreferenceChange('padding_accel', val)}
              id="hardware-acceleration"
              max={12000}
              min={1}
              unit="mm/s^2"
            />
          </Controls>
          <Controls label="Padding Accel HL">
            <UnitInput
              className={{ half: true }}
              decimal={0}
              defaultValue={getBeamboxPreferenceEditingValue('padding_accel_diode') || 4500}
              getValue={(val) => updateBeamboxPreferenceChange('padding_accel_diode', val)}
              id="hardware-acceleration"
              max={12000}
              min={1}
              unit="mm/s^2"
            />
          </Controls>
        </>
      )}
    </>
  );
}

export default Engraving;
