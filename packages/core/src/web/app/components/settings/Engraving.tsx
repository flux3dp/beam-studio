/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import Controls from 'app/components/settings/Control';
import isDev from 'helpers/is-dev';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';

interface Props {
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Engraving({
  getBeamboxPreferenceEditingValue,
  updateBeamboxPreferenceChange,
}: Props): JSX.Element {
  const lang = useI18n();
  const fastGradientOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('fast_gradient') !== false,
    { lang }
  );

  const reverseEngravingOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('reverse-engraving'),
    {
      onLabel: lang.settings.bottom_up,
      offLabel: lang.settings.top_down,
      lang,
    }
  );

  return (
    <>
      <div className="subtitle">{lang.settings.groups.engraving}</div>
      <SelectControl
        id="set-fast-gradient"
        label={lang.settings.fast_gradient}
        url={lang.settings.help_center_urls.fast_gradient}
        options={fastGradientOptions}
        onChange={(e) => updateBeamboxPreferenceChange('fast_gradient', e.target.value)}
      />
      <SelectControl
        id="set-reverse-engraving"
        label={lang.settings.engraving_direction}
        options={reverseEngravingOptions}
        onChange={(e) => updateBeamboxPreferenceChange('reverse-engraving', e.target.value)}
      />
      {isDev() && (
        <>
          <Controls label="Padding Accel">
            <UnitInput
              id="hardware-acceleration"
              unit="mm/s^2"
              min={1}
              max={12000}
              decimal={0}
              defaultValue={getBeamboxPreferenceEditingValue('padding_accel') || 5000}
              getValue={(val) => updateBeamboxPreferenceChange('padding_accel', val)}
              className={{ half: true }}
            />
          </Controls>
          <Controls label="Padding Accel HL">
            <UnitInput
              id="hardware-acceleration"
              unit="mm/s^2"
              min={1}
              max={12000}
              decimal={0}
              defaultValue={getBeamboxPreferenceEditingValue('padding_accel_diode') || 4500}
              getValue={(val) => updateBeamboxPreferenceChange('padding_accel_diode', val)}
              className={{ half: true }}
            />
          </Controls>
        </>
      )}
    </>
  );
}

export default Engraving;
