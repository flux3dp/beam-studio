/* eslint-disable react/require-default-props */
import React, { useState } from 'react';
import { Checkbox, InputRef, Modal } from 'antd';

import alertConfig, { AlertConfigKey } from 'helpers/api/alert-config';
import Input from 'app/widgets/Input';
import InputKeyWrapper from 'app/widgets/InputKeyWrapper';
import useI18n from 'helpers/useI18n';

import styles from './Prompt.module.scss';

interface Props {
  caption: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmValue?: string;
  alertConfigKey?: AlertConfigKey;
  onYes: (value?: string) => void;
  onCancel?: (value?: string) => void;
  onClose: () => void;
}

function Prompt({
  caption,
  message,
  placeholder,
  defaultValue = '',
  confirmValue,
  alertConfigKey,
  onYes,
  onCancel = () => {},
  onClose,
}: Props): JSX.Element {
  const lang = useI18n();
  const langAlert = lang.alert;
  const inputRef = React.useRef<InputRef>(null);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const messageContent =
    typeof message === 'string' ? message.split('\n').map((t) => <p key={t}>{t}</p>) : message;
  const handleOk = (): void => {
    const inputElem = inputRef.current;
    const value = inputElem?.input?.value;
    onYes(value);
    if (!confirmValue || value?.toLowerCase() === confirmValue?.toLowerCase()) {
      if (alertConfigKey && checkboxChecked) alertConfig.write(alertConfigKey, true);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleOk();
  };

  return (
    <Modal
      open
      title={caption}
      centered
      onOk={handleOk}
      onCancel={() => {
        const inputElem = inputRef.current;
        onCancel?.(inputElem?.input?.value);
        onClose();
      }}
      okText={langAlert.ok2}
      cancelText={langAlert.cancel}
    >
      {messageContent}
      <InputKeyWrapper inputRef={inputRef}>
        <Input
          autoFocus
          ref={inputRef}
          className="text-input"
          type="text"
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </InputKeyWrapper>
      {alertConfigKey && (
        <Checkbox className={styles.checkbox} onClick={() => setCheckboxChecked(!checkboxChecked)}>
          {lang.beambox.popup.dont_show_again}
        </Checkbox>
      )}
    </Modal>
  );
}

export default Prompt;
