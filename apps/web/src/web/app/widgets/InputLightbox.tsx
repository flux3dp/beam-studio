import * as React from 'react';
import { Form, Input, InputRef, Modal } from 'antd';
import { useRef, useState } from 'react';

import Constants from 'app/constants/input-lightbox-constants';
import i18n from 'helpers/i18n';

interface Props {
  type: string;
  confirmText: string;
  inputHeader: string;
  defaultValue: string;
  maxLength: number;
  caption: string;
  onClose: (from: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
}

const INPUT_TYPE_MAP = {
  [Constants.TYPE_TEXT]: 'text',
  [Constants.TYPE_NUMBER]: 'number',
  [Constants.TYPE_PASSWORD]: 'password',
  [Constants.TYPE_FILE]: 'file',
};

const InputLightBox = (props: Props): JSX.Element => {
  const inputRef = useRef<InputRef>();
  const [allowSubmit, setAllowSubmit] = useState(false);
  const {
    onClose, onSubmit,
    caption, inputHeader, defaultValue, confirmText, type, maxLength,
  } = props;

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

  const inputKeyUp = (e: React.KeyboardEvent | React.ChangeEvent<HTMLInputElement>) => {
    const target = e.currentTarget as HTMLInputElement;
    const targetFiles = target.files || [];
    setAllowSubmit(target.value.length > 0 || (targetFiles.length || 0) > 0);
  };

  const inputType = INPUT_TYPE_MAP[type] || 'text';

  return (
    <Modal
      open
      centered
      title={caption}
      cancelText={i18n.lang.alert.cancel}
      onCancel={(e) => onCancel(e)}
      okText={confirmText || i18n.lang.alert.confirm}
      onOk={(e) => processData(e)}
      okButtonProps={{ disabled: !allowSubmit }}
    >
      <Form>
        <p>{inputHeader}</p>
        <Form.Item>
          <Input
            type={inputType}
            ref={inputRef}
            defaultValue={defaultValue}
            autoFocus
            onKeyDown={(e) => handleKeyDown(e)}
            onKeyUp={inputKeyUp}
            onChange={inputKeyUp}
            maxLength={maxLength}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InputLightBox;
