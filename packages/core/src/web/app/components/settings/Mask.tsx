import React from 'react';

import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import useI18n from 'helpers/useI18n';

interface Props {
  getBeamboxPreferenceEditingValue: (key: string) => boolean;
  updateBeamboxPreferenceChange: (key: string, newVal: boolean) => void;
}

function Mask({ getBeamboxPreferenceEditingValue, updateBeamboxPreferenceChange }: Props): JSX.Element {
  const lang = useI18n();
  const maskOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('enable_mask'), { lang });
  return (
    <>
      <div className="subtitle">{lang.settings.groups.mask}</div>
      <SelectControl
        label={lang.settings.mask}
        url={lang.settings.help_center_urls.mask}
        id="set-mask"
        options={maskOptions}
        onChange={(e) => updateBeamboxPreferenceChange('enable_mask', e.target.value)}
      />
    </>
  );
}

export default Mask;
