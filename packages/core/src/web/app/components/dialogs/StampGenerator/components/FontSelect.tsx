import React, { memo, useCallback, useMemo } from 'react';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import Select from '@core/app/widgets/AntdSelect';
import { applyBundledFontStyle, getBundledFonts } from '@core/helpers/fonts/bundledFonts';
import { fontFamilySelectFilterOption, renderTextOptions } from '@core/helpers/fonts/renderTextOptions';
import { resolveFontByStyle } from '@core/helpers/fonts/resolveFontByStyle';
import { useFontStyleOptions } from '@core/helpers/fonts/useFontStyleOptions';
import useI18n from '@core/helpers/useI18n';

import type { TextOptionValues } from '../types';
import { pickRegularFace } from '../useStampStore';

import styles from './OptionsPanel.module.scss';

type Font = TextOptionValues['font'];

interface FontSelectProps {
  font: Font;
  onChange: (font: Font) => void;
}

/**
 * Family + style pickers over the app's installed/web fonts (same helpers as the text tool and keychain),
 * with the stamp-only bundled faces listed first: they are absent from the app's family lists on purpose.
 */
const FontSelect = ({ font, onChange }: FontSelectProps): React.JSX.Element => {
  const t = useI18n().generators.text_options;
  const bundled = useMemo(() => getBundledFonts(), []);
  const familyOptions = useMemo(() => {
    const bundledFamilies = new Set(bundled.map((f) => f.family));
    const installed = fontFuncs.requestAvailableFontFamilies().filter((f) => !bundledFamilies.has(f));

    return [...bundledFamilies, ...installed].map((f) => renderTextOptions(f));
  }, [bundled]);
  const styleOptions = useFontStyleOptions(font.family);

  const handleFamilyChange = useCallback(
    (family: string) => {
      const bundledFace = bundled.find((f) => f.family === family);

      if (bundledFace) {
        applyBundledFontStyle(bundledFace.postscriptName);
        onChange({ family, postscriptName: bundledFace.postscriptName, style: bundledFace.style ?? 'Regular' });

        return;
      }

      const face = pickRegularFace(fontFuncs.requestFontsOfTheFontFamily(family));

      onChange({ family, postscriptName: face?.postscriptName ?? family, style: face?.style ?? 'Regular' });
    },
    [bundled, onChange],
  );

  const handleStyleChange = useCallback(
    async (style: string) => {
      const resolved = await resolveFontByStyle(font.family, style);

      onChange(resolved ? { family: font.family, postscriptName: resolved.postscriptName, style } : { ...font, style });
    },
    [font, onChange],
  );

  return (
    <>
      <div className={styles.row}>
        <span>{t.font_family}</span>
        <Select
          filterOption={fontFamilySelectFilterOption}
          onChange={handleFamilyChange}
          options={familyOptions}
          popupMatchSelectWidth={false}
          showSearch
          style={{ width: 150 }}
          value={font.family}
        />
      </div>
      <div className={styles.row}>
        <span>{t.font_style}</span>
        <Select
          disabled={styleOptions.length <= 1}
          onChange={handleStyleChange}
          options={styleOptions}
          popupMatchSelectWidth={false}
          style={{ width: 150 }}
          value={font.style}
        />
      </div>
    </>
  );
};

FontSelect.displayName = 'FontSelect';

export default memo(FontSelect);
