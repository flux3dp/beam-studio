import type { ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { TextOptionDef, TextOptionValues } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import SwitchControl from '../Controls/SwitchControl';

import TextFields from './TextFields';

interface TextControlProps {
  optionDef: TextOptionDef;
}

const TextControl = ({ optionDef }: TextControlProps): ReactNode => {
  const { defaults, id } = optionDef;
  const text = useKeychainShapeStore((s) => s.state.texts[id]);
  const { keychain_generator: t } = useI18n();

  const handleChange = useCallback(
    (updates: Partial<TextOptionValues>) => {
      const {
        applyOptions,
        state: { texts },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ texts: { ...texts, [id]: { ...texts[id], ...updates } } });
      applyOptions();
    },
    [id],
  );
  const isTextPath = useMemo(() => 'path' in optionDef, [optionDef]);

  const handleEmbossChange = useCallback((emboss: boolean) => handleChange({ emboss }), [handleChange]);
  const handleContentChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({ text: evt.target.value }),
    [handleChange],
  );
  const handleFontSizeChange = useCallback((fontSize: number) => handleChange({ fontSize }), [handleChange]);
  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => handleChange({ letterSpacing }),
    [handleChange],
  );
  const handleLineSpacingChange = useCallback((lineSpacing: number) => handleChange({ lineSpacing }), [handleChange]);
  const handleFontChange = useCallback(
    (font: { family: string; postscriptName: string; style: string }) => handleChange({ font }),
    [handleChange],
  );

  return (
    <>
      <TextFields
        contentValue={text.text}
        defaults={defaults}
        isTextPath={isTextPath}
        onContentChange={handleContentChange}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        onLetterSpacingChange={handleLetterSpacingChange}
        onLineSpacingChange={handleLineSpacingChange}
        values={{
          font: text.font,
          fontSize: text.fontSize,
          letterSpacing: text.letterSpacing,
          lineSpacing: text.lineSpacing,
        }}
      />
      <SwitchControl label={t.emboss} onChange={handleEmbossChange} value={text.emboss} />
    </>
  );
};

TextControl.displayName = 'TextControl';

export default memo(TextControl);
