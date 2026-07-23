import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import { Input } from 'antd';
import type { TextAreaRef } from 'antd/lib/input/TextArea';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import textActions from '@core/app/svgedit/text/textactions';
import { getTextContent, renderText, textContentEvents } from '@core/app/svgedit/text/textedit';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

import styles from './TextContentBlock.module.scss';

interface Props {
  textElement: SVGTextElement;
}

function TextContentBlock({ textElement }: Props): ReactNode {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
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

  return (
    <ControlBlock className={styles.container} label={t.text_content_placeholder} type={ControlType.TEXT_CONTENT}>
      <Input.TextArea
        autoSize={isTablet ? { maxRows: 8, minRows: 2 } : { minRows: 4 }}
        id="text-content-textarea"
        onBlur={() => {
          const newVal = textContent.replace(/\n/g, '\u0085');

          // If textActions.isEditing, user switch focus from text input to text content block
          // Take them as same operation and use textActions.toSelectMode to record history
          if (textActions.isEditing) {
            textActions.toSelectMode({ newValue: newVal });

            return;
          }

          if (valueBeforeEditRef.current !== newVal) {
            const batchCmd = new history.BatchCommand('Change Text Content');

            batchCmd.addSubCommand(new history.ChangeTextCommand(textElement, valueBeforeEditRef.current, newVal));

            if (!newVal) {
              batchCmd.addSubCommand(deleteElements([textElement], true));
            }

            undoManager.addCommandToHistory(batchCmd);
          }
        }}
        onChange={(e) => {
          const displayVal = e.target.value;

          renderText(textElement, displayVal.replace(/\n/g, '\u0085'), true);
          setTextContent(getTextContent(textElement));
        }}
        onFocus={() => {
          valueBeforeEditRef.current = textContent.replace(/\n/g, '\u0085');
        }}
        placeholder={t.text_content_placeholder}
        ref={textAreaRef}
        value={textContent}
      />
    </ControlBlock>
  );
}

export default memo(TextContentBlock);
