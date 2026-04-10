import type { ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import Select from '@core/app/widgets/AntdSelect';
import { fontFamilySelectFilterOption, renderTextOptions } from '@core/helpers/fonts/renderTextOptions';
import { resolveFontByStyle } from '@core/helpers/fonts/resolveFontByStyle';
import { useFontStyleOptions } from '@core/helpers/fonts/useFontStyleOptions';

interface FontSelectProps {
  font: { family: string; postscriptName: string; style: string };
  onChange: (font: { family: string; postscriptName: string; style: string }) => void;
}

const FontSelect = ({ font, onChange }: FontSelectProps): ReactNode => {
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
      <Select
        allowClear={false}
        filterOption={fontFamilySelectFilterOption}
        onChange={handleFamilyChange}
        options={fontOptions}
        popupMatchSelectWidth={false}
        showSearch
        value={font.family}
      />
      <Select
        disabled={styleOptions.length <= 1}
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
