import React, { use, useEffect } from 'react';

import { Progress as AntdProgress, Modal } from 'antd';

import { AlertProgressContext } from '@core/app/contexts/AlertProgressContext';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type { IProgressDialog } from '@core/interfaces/IProgress';

import styles from './Progress.module.scss';

const Progress = ({ data }: { data: IProgressDialog }): React.JSX.Element => {
  const lang = useI18n();
  const isMobile = useIsMobile();
  const { popById } = use(AlertProgressContext);
  const { caption, id, key, message, onCancel, percentage, progressKey, timeout } = data;

  useEffect(() => {
    if (timeout) {
      setTimeout(() => popById(id!), timeout);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const renderMessage = (): React.JSX.Element => {
    if (typeof message === 'string') {
      return <div className="message" dangerouslySetInnerHTML={{ __html: message }} />;
    }

    return <div className="message">{message}</div>;
  };

  return (
    <Modal
      cancelText={lang.alert.cancel}
      centered
      closable={false}
      key={`${key}-${id}`}
      maskClosable={false}
      okButtonProps={{ style: { display: 'none' } }}
      onCancel={() => {
        popById(id!);
        onCancel?.();
      }}
      open
      style={{
        minWidth: isMobile ? window.innerWidth - 40 : 520,
      }}
      title={caption}
      width={isMobile ? window.innerWidth - 40 : 520}
    >
      {renderMessage()}
      <AntdProgress
        className={styles.progress}
        key={progressKey}
        percent={Number(Number(percentage).toFixed(2))}
        status="active"
        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
      />
    </Modal>
  );
};

export default Progress;
