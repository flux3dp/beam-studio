import type { ReactNode } from 'react';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { EyeFilled, InfoCircleOutlined, SettingFilled } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import type { TextAreaRef } from 'antd/lib/input/TextArea';

import { showParamsLabelSettings } from '@core/app/components/beambox/RightPanel/OptionsBlocks/TextOptions/components/ParamsLabelSettings';
import { useIsMobile } from '@core/app/stores/screenStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { renderParamsLabel } from '@core/app/svgedit/text/paramsLabel';
import textActions from '@core/app/svgedit/text/textactions';
import { getTextContent, renderText, textContentEvents } from '@core/app/svgedit/text/textedit';
import { isParamsLabel } from '@core/app/svgedit/text/textedit/getters';
import useI18n from '@core/helpers/useI18n';

import styles from './TextContentBlock.module.scss';

interface Props {
  textElement: SVGTextElement;
}

function TextContentBlock({ textElement }: Props): ReactNode {
  const { beambox, params_label: tLabel } = useI18n();
  const t = beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const [textContent, setTextContent] = useState(() => getTextContent(textElement));
  const textAreaRef = useRef<TextAreaRef>(null);
  const valueBeforeEditRef = useRef('');
  const isParamsLabelElem = useMemo(() => isParamsLabel(textElement), [textElement]);

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

  if (isParamsLabelElem) {
    return (
      <div className={styles.buttons}>
        <Tooltip title={tLabel.update}>
          <Button aria-label={tLabel.update} icon={<EyeFilled />} onClick={() => renderParamsLabel(textElement)} />
        </Tooltip>
        <Tooltip title={tLabel.settings}>
          <Button
            aria-label={tLabel.settings}
            icon={<SettingFilled />}
            onClick={() => showParamsLabelSettings(textElement)}
          />
        </Tooltip>
        <Tooltip title={tLabel.preview_hint}>
          <InfoCircleOutlined />
        </Tooltip>
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
