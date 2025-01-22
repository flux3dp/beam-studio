import React, { useMemo } from 'react';

import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import useI18n from '@core/helpers/useI18n';

interface Props {
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
}

function TextToPath({ getBeamboxPreferenceEditingValue, updateBeamboxPreferenceChange }: Props): React.JSX.Element {
  const lang = useI18n();

  const isFontSubstitutionOn = getBeamboxPreferenceEditingValue('font-substitute') !== false;
  const fontSubstituteOptions = onOffOptionFactory(isFontSubstitutionOn, { lang });
  const defaultFontConvert = getBeamboxPreferenceEditingValue('font-convert') || '2.0';
  const defaultLaserModuleOptions = useMemo(
    () => [
      { label: '1.0', selected: defaultFontConvert === '1.0', value: '1.0' },
      { label: '2.0', selected: defaultFontConvert === '2.0', value: '2.0' },
    ],
    [defaultFontConvert],
  );

  return (
    <>
      <div className="subtitle">{lang.settings.groups.text_to_path}</div>
      <SelectControl
        id="font-substitue"
        label={lang.settings.font_substitute}
        onChange={(e) => updateBeamboxPreferenceChange('font-substitute', e.target.value)}
        options={fontSubstituteOptions}
        url={lang.settings.help_center_urls.font_substitute}
      />
      <SelectControl
        id="font-convert"
        label={lang.settings.font_convert}
        onChange={(e) => updateBeamboxPreferenceChange('font-convert', e.target.value)}
        options={defaultLaserModuleOptions}
        url={lang.settings.help_center_urls.font_convert}
      />
    </>
  );
}

export default TextToPath;
