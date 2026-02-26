import React, { useEffect, useRef, useState } from 'react';

import { Input } from 'antd';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getTextContent, renderText, textContentEvents } from '@core/app/svgedit/text/textedit';

import styles from '../index.module.scss';

interface Props {
  textElement: SVGTextElement;
}

export default function TextContentBlock({ textElement }: Props): React.JSX.Element {
  const [textContent, setTextContent] = useState(() => getTextContent(textElement));
  const valueBeforeEditRef = useRef('');

  useEffect(() => {
    setTextContent(getTextContent(textElement));
  }, [textElement]);

  useEffect(() => {
    const handleChanged = () => {
      setTextContent(getTextContent(textElement));
    };

    textContentEvents.on('changed', handleChanged);

    return () => {
      textContentEvents.removeListener('changed', handleChanged);
    };
  }, [textElement]);

  return (
    <div className={styles['text-content']}>
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
        value={textContent}
      />
    </div>
  );
}
