import * as React from 'react';
import { useRef, useState } from 'react';

import type { InputRef } from 'antd';
import { Form, Input, Modal } from 'antd';

import Constants from '@core/app/constants/input-lightbox-constants';
import i18n from '@core/helpers/i18n';

interface Props {
  caption: string;
  confirmText: string;
  defaultValue: string;
  inputHeader: string;
  maxLength: number;
  onClose: (from: string) => void;
  onSubmit: (value: string) => Promise<void> | void;
  type: string;
}

const INPUT_TYPE_MAP = {
  [Constants.TYPE_FILE]: 'file',
  [Constants.TYPE_NUMBER]: 'number',
  [Constants.TYPE_PASSWORD]: 'password',
  [Constants.TYPE_TEXT]: 'text',
};

const InputLightBox = (props: Props): React.JSX.Element => {
  const inputRef = useRef<InputRef>();
  const [allowSubmit, setAllowSubmit] = useState(false);
  const { caption, confirmText, defaultValue, inputHeader, maxLength, onClose, onSubmit, type } = props;

  const onCancel = (e) => {
    e.preventDefault();
    onClose('cancel');
  };

  const processData = (e) => {
    e.preventDefault();

    let returnValue;
    const inputElement = inputRef.current.input;

    if (Constants.TYPE_FILE === type) {
      returnValue = inputElement.files;
    } else {
      returnValue = inputElement.value;
    }

    const result = onSubmit(returnValue);

    console.info('Submit result', result);
    onClose('submit');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const inputKeyUp = (e: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const targetFiles = target.files || [];

    setAllowSubmit(target.value.length > 0 || (targetFiles.length || 0) > 0);
  };

  const inputType = INPUT_TYPE_MAP[type] || 'text';

  return (
    <Modal
      cancelText={i18n.lang.alert.cancel}
      centered
      okButtonProps={{ disabled: !allowSubmit }}
      okText={confirmText || i18n.lang.alert.confirm}
      onCancel={(e) => onCancel(e)}
      onOk={(e) => processData(e)}
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
            onKeyDown={(e) => handleKeyDown(e)}
            onKeyUp={inputKeyUp}
            ref={inputRef}
            type={inputType}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InputLightBox;
