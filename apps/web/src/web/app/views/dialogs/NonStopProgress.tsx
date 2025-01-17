import React, { useContext, useEffect } from 'react';
import { Modal } from 'antd';
import { SpinLoading } from 'antd-mobile';

import useI18n from 'helpers/useI18n';
import { AlertProgressContext } from 'app/contexts/AlertProgressContext';
import { IProgressDialog } from 'interfaces/IProgress';

import styles from './AlertAndProgress.module.scss';

const NonStopProgress = ({ data }: { data: IProgressDialog }): JSX.Element => {
  const lang = useI18n();
  const { popById } = useContext(AlertProgressContext);
  const { key, id, caption, timeout, onCancel } = data;
  useEffect(() => {
    if (timeout) setTimeout(() => popById(id), timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Modal
      open
      className={styles.nonstop}
      key={`${key}-${id}`}
      style={{
        minWidth: 150,
      }}
      width="fit-content"
      onCancel={() => {
        popById(id);
        onCancel();
      }}
      centered
      closable={false}
      maskClosable={false}
      cancelText={lang.alert.cancel}
      cancelButtonProps={onCancel ? undefined : { style: { display: 'none' } }}
      okButtonProps={{ style: { display: 'none' } }}
    >
      <div>
        <div className={styles['spinner-container']}>
          <SpinLoading color="primary" style={{ '--size': '48px' }} />
        </div>
        <div className={styles.caption}>{caption}</div>
      </div>
    </Modal>
  );
};

export default NonStopProgress;
