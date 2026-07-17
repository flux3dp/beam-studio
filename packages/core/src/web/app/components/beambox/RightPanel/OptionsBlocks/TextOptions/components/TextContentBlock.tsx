import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import { EyeFilled, SettingFilled } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import type { TextAreaRef } from 'antd/lib/input/TextArea';

import { useIsMobile } from '@core/app/stores/screenStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { renderLayerConfigText, showLayerConfigSettings } from '@core/app/svgedit/text/taskConfigText';
import textActions from '@core/app/svgedit/text/textactions';
import { getTextContent, renderText, textContentEvents } from '@core/app/svgedit/text/textedit';
import useI18n from '@core/helpers/useI18n';

import styles from './TextContentBlock.module.scss';

interface Props {
  textElement: SVGTextElement;
}

function TextContentBlock({ textElement }: Props): ReactNode {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const [textContent, setTextContent] = useState(() => getTextContent(textElement));
  const textAreaRef = useRef<TextAreaRef>(null);
  const valueBeforeEditRef = useRef('');
  const isLayerConfigText = textElement.getAttribute('data-layer-config') === 'true';

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

  if (isLayerConfigText) {
    return (
      <div className={styles.buttons}>
        <Button
          icon={<EyeFilled />}
          onClick={() => {
            renderLayerConfigText(textElement);
            textContentEvents.emit('changed', textElement);
          }}
        />
        <Button icon={<SettingFilled />} onClick={() => showLayerConfigSettings(textElement)} />
        <Tooltip title="Don't set rotation/vertical text on Layer Config Objects">⚠️</Tooltip>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Input.TextArea
        autoSize={{ minRows: 4 }}
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

          setTextContent(displayVal);
          renderText(textElement, displayVal.replace(/\n/g, '\u0085'), true);
        }}
        onFocus={() => {
          valueBeforeEditRef.current = textContent.replace(/\n/g, '\u0085');
        }}
        placeholder={t.text_content_placeholder}
        ref={textAreaRef}
        value={textContent}
      />
    </div>
  );
}

export default memo(TextContentBlock);
