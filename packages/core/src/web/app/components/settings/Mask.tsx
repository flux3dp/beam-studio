import React from 'react';

import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import useI18n from '@core/helpers/useI18n';

interface Props {
  getBeamboxPreferenceEditingValue: (key: string) => boolean;
  updateBeamboxPreferenceChange: (key: string, newVal: boolean) => void;
}

function Mask({ getBeamboxPreferenceEditingValue, updateBeamboxPreferenceChange }: Props): React.JSX.Element {
  const lang = useI18n();
  const maskOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('enable_mask'), { lang });

  return (
    <>
      <div className="subtitle">{lang.settings.groups.mask}</div>
      <SelectControl
        id="set-mask"
        label={lang.settings.mask}
        onChange={(e) => updateBeamboxPreferenceChange('enable_mask', e.target.value)}
        options={maskOptions}
        url={lang.settings.help_center_urls.mask}
      />
    </>
  );
}

export default Mask;
