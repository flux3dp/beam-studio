import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import { Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { TextOptionDef, TextOptionValues } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import GroupControl from '../Controls/GroupControl';

import TextFields from './TextFields';

interface TextGroupProps {
  optionDef: TextOptionDef;
}

const TextGroup = ({ optionDef }: TextGroupProps): ReactNode => {
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

  const handleEnabledChange = useCallback((enabled: boolean) => handleChange({ enabled }), [handleChange]);
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
    <GroupControl enabled={text.enabled} id={id} onToggle={handleEnabledChange} title={t.text}>
      <TextFields
        contentValue={text.text}
        defaults={defaults}
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
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span>{t.emboss}</span>
        <Switch checked={text.emboss} onChange={handleEmbossChange} size="small" />
      </div>
    </GroupControl>
  );
};

TextGroup.displayName = 'TextGroup';

export default memo(TextGroup);
