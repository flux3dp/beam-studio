import React, { useContext, useEffect } from 'react';
import { Modal, Progress as AntdProgress } from 'antd';

import useI18n from 'helpers/useI18n';
import { AlertProgressContext } from 'app/contexts/AlertProgressContext';
import { IProgressDialog } from 'interfaces/IProgress';
import { useIsMobile } from 'helpers/system-helper';

const Progress = ({ data }: { data: IProgressDialog }): JSX.Element => {
  const lang = useI18n();
  const isMobile = useIsMobile();
  const { popById } = useContext(AlertProgressContext);
  const { message, percentage, timeout, key, id, caption, onCancel } = data;
  useEffect(() => {
    if (timeout) setTimeout(() => popById(id), timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMessage = (): JSX.Element => {
    if (typeof message === 'string') {
      return (
        <div
          className="message"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: message }}
        />
      );
    }
    return <div className="message">{message}</div>;
  };

  return (
    <Modal
      key={`${key}-${id}`}
      style={{
        minWidth: isMobile ? window.innerWidth - 40 : 520,
      }}
      width={isMobile ? window.innerWidth - 40 : 520}
      open
      title={caption}
      onCancel={() => {
        popById(id);
        onCancel();
      }}
      centered
      closable={false}
      maskClosable={false}
      cancelText={lang.alert.cancel}
      okButtonProps={{ style: { display: 'none' } }}
    >
      {renderMessage()}
      <AntdProgress
        status="active"
        percent={Number(Number(percentage).toFixed(2))}
        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
      />
    </Modal>
  );
};

export default Progress;
