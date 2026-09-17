import React, { memo, useCallback, useMemo } from 'react';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import Select from '@core/app/widgets/AntdSelect';
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

/** Family + style pickers over the app's installed/web fonts (same helpers as the text tool and keychain). */
const FontSelect = ({ font, onChange }: FontSelectProps): React.JSX.Element => {
  const t = useI18n().generators.text_options;
  const familyOptions = useMemo(() => fontFuncs.requestAvailableFontFamilies().map((f) => renderTextOptions(f)), []);
  const styleOptions = useFontStyleOptions(font.family);

  const handleFamilyChange = useCallback(
    (family: string) => {
      const face = pickRegularFace(fontFuncs.requestFontsOfTheFontFamily(family));

      onChange({ family, postscriptName: face?.postscriptName ?? family, style: face?.style ?? 'Regular' });
    },
    [onChange],
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
