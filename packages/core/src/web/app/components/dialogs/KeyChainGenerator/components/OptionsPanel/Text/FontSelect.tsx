import type { ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import { fontFamilySelectFilterOption, renderTextOptions } from '@core/helpers/fonts/renderTextOptions';
import { resolveFontByStyle } from '@core/helpers/fonts/resolveFontByStyle';
import { useFontStyleOptions } from '@core/helpers/fonts/useFontStyleOptions';
import useI18n from '@core/helpers/useI18n';

import SelectControl from '../Controls/SelectControl';

interface FontSelectProps {
  font: { family: string; postscriptName: string; style: string };
  onChange: (font: { family: string; postscriptName: string; style: string }) => void;
}

const FontSelect = ({ font, onChange }: FontSelectProps): ReactNode => {
  const t = useI18n().keychain_generator.text_options;

  const fontOptions = useMemo(() => {
    return fontFuncs.requestAvailableFontFamilies().map((value: string) => renderTextOptions(value));
  }, []);
  const styleOptions = useFontStyleOptions(font.family);

  const handleFamilyChange = useCallback(
    (family: string) => {
      const fonts = fontFuncs.requestFontsOfTheFontFamily(family);
      const firstFont = fonts[0];

      onChange({ family, postscriptName: firstFont?.postscriptName ?? family, style: firstFont?.style ?? 'Regular' });
    },
    [onChange],
  );

  const handleStyleChange = useCallback(
    async (selectedStyle: string) => {
      const { family } = font;
      const resolved = await resolveFontByStyle(family, selectedStyle);

      if (resolved) {
        onChange({ family, postscriptName: resolved.postscriptName, style: selectedStyle });
      } else {
        // Fallback: update style label only
        onChange({ ...font, style: selectedStyle });
      }
    },
    [font, onChange],
  );

  return (
    <>
      <SelectControl
        filterOption={fontFamilySelectFilterOption}
        label={t.font_family}
        onChange={handleFamilyChange}
        options={fontOptions}
        popupMatchSelectWidth={false}
        showSearch
        value={font.family}
        width={150}
      />
      <SelectControl
        disabled={styleOptions.length <= 1}
        label={t.font_style}
        onChange={handleStyleChange}
        options={styleOptions}
        popupMatchSelectWidth={false}
        value={font.style}
      />
    </>
  );
};

FontSelect.displayName = 'FontSelect';

export default memo(FontSelect);
