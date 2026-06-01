import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { CustomShapeTextOptionDef, CustomShapeTextValues } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import GroupCollapse from '../Controls/GroupCollapse';
import TextFields from '../Text/TextFields';

interface CustomShapeTextGroupProps {
  textDef: CustomShapeTextOptionDef;
}

const CustomShapeTextGroup = ({ textDef }: CustomShapeTextGroupProps): ReactNode => {
  const { defaults } = textDef;
  const customShapeText = useKeychainShapeStore((s) => s.state.customShapeText);
  const { keychain_generator: t } = useI18n();

  const [textDraft, setTextDraft] = useState(customShapeText.text);

  useEffect(() => {
    setTextDraft(customShapeText.text);
  }, [customShapeText.text]);

  const handleTextChange = useCallback(async (updates: Partial<CustomShapeTextValues>) => {
    const {
      applyOptions,
      buildBaseShape,
      category,
      state: { customShapeText },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ customShapeText: { ...customShapeText, ...updates } });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  const handleContentChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextDraft(evt.target.value);
      handleTextChange({ text: evt.target.value });
    },
    [handleTextChange],
  );
  const handleFontChange = useCallback(
    (font: { family: string; postscriptName: string; style: string }) => handleTextChange({ font }),
    [handleTextChange],
  );
  const handleFontSizeChange = useCallback((fontSize: number) => handleTextChange({ fontSize }), [handleTextChange]);
  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => handleTextChange({ letterSpacing }),
    [handleTextChange],
  );
  const handleLineSpacingChange = useCallback(
    (lineSpacing: number) => handleTextChange({ lineSpacing }),
    [handleTextChange],
  );

  const textValues = useMemo(
    () => ({
      font: customShapeText.font,
      fontSize: customShapeText.fontSize,
      letterSpacing: customShapeText.letterSpacing,
      lineSpacing: customShapeText.lineSpacing,
    }),
    [customShapeText.font, customShapeText.fontSize, customShapeText.letterSpacing, customShapeText.lineSpacing],
  );

  return (
    <GroupCollapse title={t.text}>
      <TextFields
        contentValue={textDraft}
        defaults={defaults}
        onContentChange={handleContentChange}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        onLetterSpacingChange={handleLetterSpacingChange}
        onLineSpacingChange={handleLineSpacingChange}
        values={textValues}
      />
    </GroupCollapse>
  );
};

CustomShapeTextGroup.displayName = 'CustomShapeTextGroup';

export default memo(CustomShapeTextGroup);
