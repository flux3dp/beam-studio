import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import { Input } from 'antd';
import type { TextAreaRef } from 'antd/lib/input/TextArea';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getTextContent, renderText, textContentEvents } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './TextContentBlock.module.scss';

interface Props {
  textElement: SVGTextElement;
}

function TextContentBlock({ textElement }: Props): ReactNode {
  const isMobile = useIsMobile();
  const [textContent, setTextContent] = useState(() => getTextContent(textElement));
  const textAreaRef = useRef<TextAreaRef>(null);
  const valueBeforeEditRef = useRef('');

  useEffect(() => {
    setTextContent(getTextContent(textElement));
  }, [textElement]);

  useEffect(() => {
    const handleChanged = () => {
      const newValue = getTextContent(textElement);

      const textAreaElement = textAreaRef.current?.resizableTextArea?.textArea;

      if (textAreaElement) {
        // Clear undo history if updated by other source to avoid confusion of undo history
        textAreaElement.value = newValue;
      }

      setTextContent(newValue);
    };

    textContentEvents.on('changed', handleChanged);

    return () => {
      textContentEvents.removeListener('changed', handleChanged);
    };
  }, [textElement]);

  if (isMobile) return null;

  return (
    <div className={styles.container}>
      <Input.TextArea
        autoSize={{ minRows: 2 }}
        id="text-content-textarea"
        onBlur={() => {
          const newVal = textContent.replace(/\n/g, '\u0085');

          if (valueBeforeEditRef.current !== newVal) {
            const cmd = new history.ChangeTextCommand(textElement, valueBeforeEditRef.current, newVal);

            undoManager.addCommandToHistory(cmd);
          }
        }}
        onChange={(e) => {
          const displayVal = e.target.value;

          setTextContent(displayVal);
          renderText(textElement, displayVal.replace(/\n/g, '\u0085'), true);
        }}
        onFocus={() => {
          valueBeforeEditRef.current = textContent.replace(/\n/g, '\u0085');
        }}
        ref={textAreaRef}
        value={textContent}
      />
    </div>
  );
}

export default memo(TextContentBlock);
