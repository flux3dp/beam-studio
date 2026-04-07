import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import { Input } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { TextOptionDef, TextOptionValues } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import FontSelect from './FontSelect';
import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import NumberControl from './NumberControl';

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
        state: { texts },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ texts: { ...texts, [id]: { ...texts[id], ...updates } } });
    },
    [id],
  );

  const handleEnabledChange = useCallback((enabled: boolean) => handleChange({ enabled }), [handleChange]);
  const handleContentChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({ content: evt.target.value }),
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
      <div className={styles.content}>
        <Input.TextArea
          autoSize={{ maxRows: 4, minRows: 2 }}
          onChange={handleContentChange}
          placeholder={t.text_placeholder}
          value={text.content}
        />
        <FontSelect font={text.font} onChange={handleFontChange} />
        <NumberControl
          defaultValue={defaults.fontSize}
          label={t.font_size}
          max={300}
          min={10}
          onChange={handleFontSizeChange}
          step={1}
          unit="px"
          value={text.fontSize}
          withSlider={false}
        />
        <NumberControl
          defaultValue={defaults.letterSpacing}
          label={t.letter_spacing}
          max={20}
          min={-5}
          onChange={handleLetterSpacingChange}
          step={0.5}
          unit="px"
          value={text.letterSpacing}
          withSlider={false}
        />
        <NumberControl
          defaultValue={defaults.lineSpacing}
          label={t.line_spacing}
          max={5}
          min={0.5}
          onChange={handleLineSpacingChange}
          step={0.1}
          unit="x"
          value={text.lineSpacing}
          withSlider={false}
        />
      </div>
    </GroupControl>
  );
};

TextGroup.displayName = 'TextGroup';

export default memo(TextGroup);
