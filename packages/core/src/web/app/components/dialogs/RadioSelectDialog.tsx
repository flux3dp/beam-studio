import React, { useState } from 'react';

import { Modal, Radio, Space } from 'antd';

import useI18n from '@core/helpers/useI18n';

interface Props<T = string> {
  defaultValue: T;
  onCancel: () => void;
  onOk: (val: T) => void;
  options: Array<{ label: string; value: T }>;
  title: string;
}

// TODO: add test
function RadioSelectDialog<T = string>({ defaultValue, onCancel, onOk, options, title }: Props<T>): React.JSX.Element {
  const [value, setValue] = useState(defaultValue);
  const handleOk = () => onOk(value);
  const lang = useI18n().alert;

  return (
    <Modal
      cancelText={lang.cancel}
      centered
      maskClosable={false}
      okText={lang.ok}
      onCancel={onCancel}
      onOk={handleOk}
      open
      title={title}
    >
      <Radio.Group onChange={(e) => setValue(e.target.value)} value={value}>
        <Space direction="vertical">
          {options.map((option) => (
            <Radio key={option.label} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </Modal>
  );
}

export default RadioSelectDialog;
