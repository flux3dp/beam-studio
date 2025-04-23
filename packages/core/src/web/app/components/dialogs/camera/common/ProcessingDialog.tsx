import React, { useEffect } from 'react';

import { Modal } from 'antd';
import { SpinLoading } from 'antd-mobile';

import alertCaller from '@core/app/actions/alert-caller';

import styles from './ProcessingDialog.module.scss';

interface Props {
  onClose?: (completed?: boolean) => void;
  onNext: () => void;
  process: () => Promise<void>;
}

const ProcessingDialog = ({ onClose, onNext, process }: Props) => {
  useEffect(() => {
    const runProcess = async () => {
      try {
        await process();
        onNext();
      } catch (error) {
        alertCaller.popUpError({ message: 'Failed to process' });
        console.error('Processing error:', error);
      }
    };

    runProcess();
  }, [onClose, onNext, process]);

  return (
    <Modal
      centered
      closable={!!onClose}
      footer={[]}
      maskClosable={false}
      onCancel={() => onClose?.(false)}
      open
      width={400}
    >
      <SpinLoading className={styles.spinner} color="primary" style={{ '--size': '48px' }} />
    </Modal>
  );
};

export default ProcessingDialog;
