import React, { useState } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import SettingSelect from '@core/app/components/settings/components/SettingSelect';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type { GeneralFont, IDefaultFont } from '@core/interfaces/IFont';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);

function Text(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  const [defaultFont, updateDefaultFont] = useState<IDefaultFont>(
    storage.get('default-font') || { family: 'Arial', style: 'Regular' },
  );

  const fontOptions = fontFamilies.map((family: string) => {
    const fontName = FontFuncs.fontNameMap.get(family);
    const label = typeof fontName === 'string' ? fontName : family;

    return { label, value: family };
  });

  const fontStyleOptions = FontFuncs
    //
    .requestFontsOfTheFontFamily(defaultFont.family)
    .map(({ postscriptName, style }) => ({ label: style, value: postscriptName }));

  const fontConvertOptions = [
    { label: '1.0', value: '1.0' },
    { label: '2.0', value: '2.0' },
  ];

  const setFont = (family: string) => {
    const fonts: GeneralFont[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont: IDefaultFont = fonts.filter(({ style }) => style === 'Regular')[0] || fonts[0];

    storage.set('default-font', {
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
    updateDefaultFont({
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
  };

  const setFontStyle = (postscriptName: string) => {
    const newDefaultFont = FontFuncs.getFontOfPostscriptName(postscriptName);

    storage.set('default-font', {
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
    updateDefaultFont({
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
  };

  return (
    <>
      <SettingSelect
        defaultValue={defaultFont.family as string}
        id="set-default-font-family"
        label={lang.settings.default_font_family}
        onChange={(e) => setFont(e)}
        options={fontOptions}
      />
      <SettingSelect
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        onChange={(e) => setFontStyle(e)}
        options={fontStyleOptions}
        value={(defaultFont.postscriptName ?? defaultFont.style) as string}
      />
      <SettingSwitch
        checked={getPreference('font-substitute')}
        id="font-substitue"
        label={lang.settings.font_substitute}
        onChange={(e) => setPreference('font-substitute', e)}
        url={lang.settings.help_center_urls.font_substitute}
      />
      <SettingSelect
        defaultValue={getPreference('font-convert')}
        id="font-convert"
        label={lang.settings.font_convert}
        onChange={(e) => setPreference('font-convert', e)}
        options={fontConvertOptions}
        url={lang.settings.help_center_urls.font_convert}
      />
    </>
  );
}

export default Text;
