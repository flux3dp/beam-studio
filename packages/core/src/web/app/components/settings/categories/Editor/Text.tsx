import React, { useMemo } from 'react';

import { pick } from 'remeda';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { getStorage } from '@core/app/stores/storageStore';
import useI18n from '@core/helpers/useI18n';
import type { GeneralFont, IDefaultFont } from '@core/interfaces/IFont';

import { SettingSelect, SettingSwitch, useSettingStore } from '../../shared';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);
const DEFAULT_FONT: IDefaultFont = { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' };

function Text(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setConfig, setPreference } = useSettingStore();
  // Subscribe to configChanges to trigger re-render when font is updated
  const configChanges = useSettingStore((state) => state.configChanges);

  // Read from pending changes first, then storage, then default
  const defaultFont = useMemo<IDefaultFont>(() => {
    const pendingFont = configChanges['default-font'] as IDefaultFont | undefined;

    return pendingFont || getStorage('default-font') || DEFAULT_FONT;
  }, [configChanges]);

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

  const saveFont = (font: IDefaultFont) => {
    const fontData = pick(font, ['family', 'style', 'postscriptName']);

    setConfig('default-font', fontData);
  };

  const setFont = (family: string) => {
    const fonts: GeneralFont[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont = fonts.find(({ style }) => style === 'Regular') || fonts[0];

    saveFont(newDefaultFont);
  };

  const setFontStyle = (postscriptName: string) => {
    saveFont(FontFuncs.getFontOfPostscriptName(postscriptName));
  };

  return (
    <>
      <SettingSelect
        defaultValue={defaultFont.family as string}
        id="set-default-font-family"
        label={lang.settings.default_font_family}
        onChange={setFont}
        options={fontOptions}
      />
      <SettingSelect
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        onChange={setFontStyle}
        options={fontStyleOptions}
        value={(defaultFont.postscriptName ?? defaultFont.style) as string}
      />
      <SettingSwitch
        checked={getPreference('font-substitute')}
        id="font-substitue"
        label={lang.settings.font_substitute}
        onChange={(value) => setPreference('font-substitute', value)}
        url={lang.settings.help_center_urls.font_substitute}
      />
      <SettingSelect
        defaultValue={getPreference('font-convert')}
        id="font-convert"
        label={lang.settings.font_convert}
        onChange={(value) => setPreference('font-convert', value)}
        options={fontConvertOptions}
        url={lang.settings.help_center_urls.font_convert}
      />
    </>
  );
}

export default Text;
