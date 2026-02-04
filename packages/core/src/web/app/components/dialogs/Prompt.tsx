import React, { useState } from 'react';

import type { InputRef } from 'antd';
import { Checkbox, Modal } from 'antd';

import Input from '@core/app/widgets/Input';
import InputKeyWrapper from '@core/app/widgets/InputKeyWrapper';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import alertConfig from '@core/helpers/api/alert-config';
import useI18n from '@core/helpers/useI18n';

import styles from './Prompt.module.scss';

interface Props {
  alertConfigKey?: AlertConfigKey;
  caption: string;
  confirmValue?: string;
  defaultValue?: string;
  message?: string;
  onCancel?: (value?: string) => void;
  onClose: () => void;
  onYes: (value?: string) => void;
  placeholder?: string;
}

function Prompt({
  alertConfigKey,
  caption,
  confirmValue,
  defaultValue = '',
  message,
  onCancel = () => {},
  onClose,
  onYes,
  placeholder,
}: Props): React.JSX.Element {
  const t = useI18n().alert;
  const inputRef = React.useRef<InputRef>(null);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const messageContent = typeof message === 'string' ? message.split('\n').map((t) => <p key={t}>{t}</p>) : message;
  const handleOk = (): void => {
    const inputElem = inputRef.current;
    const value = inputElem?.input?.value;

    onYes(value);

    if (!confirmValue || value?.toLowerCase() === confirmValue?.toLowerCase()) {
      if (alertConfigKey && checkboxChecked) {
        alertConfig.write(alertConfigKey, true);
      }

      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleOk();
    }
  };

  return (
    <Modal
      cancelText={t.cancel}
      centered
      okText={t.ok2}
      onCancel={() => {
        const inputElem = inputRef.current;

        onCancel?.(inputElem?.input?.value);
        onClose();
      }}
      onOk={handleOk}
      open
      title={caption}
    >
      {messageContent}
      <InputKeyWrapper inputRef={inputRef}>
        <Input
          autoFocus
          className="text-input"
          defaultValue={defaultValue}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
        />
      </InputKeyWrapper>
      {alertConfigKey && (
        <Checkbox className={styles.checkbox} onClick={() => setCheckboxChecked(!checkboxChecked)}>
          {t.dont_show_again}
        </Checkbox>
      )}
    </Modal>
  );
}

export default Prompt;
