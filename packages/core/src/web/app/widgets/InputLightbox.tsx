import React from 'react';
import { useRef, useState } from 'react';

import type { InputRef } from 'antd';
import { Form, Input, Modal } from 'antd';

import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import i18n from '@core/helpers/i18n';
import type { InputType, InputValue } from '@core/interfaces/IDialog';

interface Props<T extends InputType> {
  caption: string;
  confirmText: string;
  defaultValue: string;
  inputHeader: string;
  maxLength: number;
  onCancel?: () => void;
  onClose: () => void;
  onSubmit: (value: InputValue<T>) => Promise<void> | void;
  type: T;
}

function InputLightBox<T extends InputType>({
  caption,
  confirmText,
  defaultValue,
  inputHeader,
  maxLength,
  onCancel,
  onClose,
  onSubmit,
  type,
}: Props<T>): JSX.Element {
  const inputRef = useRef<InputRef>(null);
  const [allowSubmit, setAllowSubmit] = useState(false);

  useNewShortcutsScope();

  const handleCancel = () => {
    onClose();
    onCancel?.();
  };

  const handleOk = () => {
    const inputElement = inputRef.current?.input;

    if (inputElement) {
      if (type === 'file') {
        (onSubmit as (value: FileList) => void)(inputElement.files!);
      } else if (type === 'number') {
        (onSubmit as (value: number) => void)(Number(inputElement.value));
      } else {
        (onSubmit as (value: string) => void)(inputElement.value);
      }

      onClose();
    }
  };

  const inputKeyUp = (e: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const targetFiles = target.files || [];

    setAllowSubmit(target.value.length > 0 || (targetFiles.length || 0) > 0);
  };

  return (
    <Modal
      cancelText={i18n.lang.alert.cancel}
      centered
      okButtonProps={{ disabled: !allowSubmit }}
      okText={confirmText || i18n.lang.alert.confirm}
      onCancel={handleCancel}
      onOk={handleOk}
      open
      title={caption}
    >
      <Form>
        <p>{inputHeader}</p>
        <Form.Item>
          <Input
            autoFocus
            defaultValue={defaultValue}
            maxLength={maxLength}
            onChange={inputKeyUp}
            onKeyUp={inputKeyUp}
            ref={inputRef}
            type={type}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default InputLightBox;
