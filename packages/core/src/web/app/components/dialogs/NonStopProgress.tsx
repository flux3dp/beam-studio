import React, { use, useEffect } from 'react';

import { Modal } from 'antd';
import { SpinLoading } from 'antd-mobile';

import { AlertProgressContext } from '@core/app/contexts/AlertProgressContext';
import useI18n from '@core/helpers/useI18n';
import type { IProgressDialog } from '@core/interfaces/IProgress';

import styles from './AlertAndProgress.module.scss';

const NonStopProgress = ({ data }: { data: IProgressDialog }): React.JSX.Element => {
  const lang = useI18n();
  const { popById } = use(AlertProgressContext);
  const { caption, id, key, onCancel, timeout } = data;

  useEffect(() => {
    if (timeout) {
      setTimeout(() => popById(id), timeout);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      cancelButtonProps={onCancel ? undefined : { style: { display: 'none' } }}
      cancelText={lang.alert.cancel}
      centered
      className={styles.nonstop}
      closable={false}
      key={`${key}-${id}`}
      maskClosable={false}
      okButtonProps={{ style: { display: 'none' } }}
      onCancel={() => {
        popById(id);
        onCancel?.();
      }}
      open
      style={{
        minWidth: 150,
      }}
      width="fit-content"
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
