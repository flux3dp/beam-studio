import React, { useState } from 'react';

import { pick } from 'remeda';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type { GeneralFont, IDefaultFont } from '@core/interfaces/IFont';

import { SettingSelect, SettingSwitch, useSettingStore } from '../../shared';

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

  const saveAndUpdateFont = (font: IDefaultFont) => {
    const fontData = pick(font, ['family', 'style', 'postscriptName']);

    storage.set('default-font', fontData);
    updateDefaultFont(fontData);
  };

  const setFont = (family: string) => {
    const fonts: GeneralFont[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont = fonts.find(({ style }) => style === 'Regular') || fonts[0];

    saveAndUpdateFont(newDefaultFont);
  };

  const setFontStyle = (postscriptName: string) => {
    saveAndUpdateFont(FontFuncs.getFontOfPostscriptName(postscriptName));
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
