import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import { Input } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { TextOptionValues } from '../../types';

import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import NumberControl from './NumberControl';

interface TextGroupProps {
  defaults: TextOptionValues;
  id: string;
  onTextChange: (id: string, updates: Partial<TextOptionValues>) => void;
  text: TextOptionValues;
}

const TextGroup = ({ defaults, id, onTextChange, text }: TextGroupProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const handleEnabledChange = useCallback((enabled: boolean) => onTextChange(id, { enabled }), [id, onTextChange]);
  const handleContentChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => onTextChange(id, { content: evt.target.value }),
    [id, onTextChange],
  );
  const handleFontSizeChange = useCallback((fontSize: number) => onTextChange(id, { fontSize }), [id, onTextChange]);
  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => onTextChange(id, { letterSpacing }),
    [id, onTextChange],
  );
  const handleLineSpacingChange = useCallback(
    (lineSpacing: number) => onTextChange(id, { lineSpacing }),
    [id, onTextChange],
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
        <NumberControl
          defaultValue={defaults.fontSize}
          label={t.font_size}
          max={100}
          min={10}
          onChange={handleFontSizeChange}
          step={1}
          unit="px"
          value={text.fontSize}
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
        />
        <NumberControl
          defaultValue={defaults.lineSpacing}
          label={t.line_spacing}
          max={3}
          min={0.5}
          onChange={handleLineSpacingChange}
          step={0.1}
          unit="x"
          value={text.lineSpacing}
        />
      </div>
    </GroupControl>
  );
};

TextGroup.displayName = 'TextGroup';

export default memo(TextGroup);
