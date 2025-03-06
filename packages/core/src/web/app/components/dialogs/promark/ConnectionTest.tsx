import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Modal, Progress } from 'antd';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { generateCalibrationTaskString, loadTaskToSwiftray } from '@core/helpers/device/promark/calibration';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

import styles from './ConnectionTest.module.scss';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
}

const results: Array<keyof ILang['promark_connection_test']> = ['res_0', 'res_1', 'res_2', 'res_3', 'res_4'];
const worst = results.length - 1;

const ConnectionTest = ({ device, onClose }: Props): React.JSX.Element => {
  const { global: tGlobal, promark_connection_test: t } = useI18n();
  const { model } = device;
  const { width } = useMemo(() => getWorkarea(model), [model]);
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(Number.NaN);
  const previewTask = useRef<string>('');
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    previewTask.current = '';
  }, [width]);

  const uploadPreviewTask = useCallback(async () => {
    if (!previewTask.current) {
      previewTask.current = await generateCalibrationTaskString({ width });
    }

    await loadTaskToSwiftray(previewTask.current, model);
  }, [model, width]);

  useEffect(() => {
    const abortPreview = () => {
      clearInterval(timerRef.current);
      setProgress(0);
      setIsTesting(false);
    };

    swiftrayClient.on('disconnected', abortPreview);

    return () => {
      swiftrayClient.off('disconnected', abortPreview);
      clearInterval(timerRef.current);
      deviceMaster.stopFraming();
    };
  }, []);

  const togglePreview = async (completed = false) => {
    if (!isTesting) {
      await uploadPreviewTask();
      await deviceMaster.startFraming();
      setIsTesting(true);
      setResult(Number.NaN);
      setProgress(0);
      timerRef.current = setInterval(() => setProgress((prev) => Math.min(prev + 1, 100)), 1200);
    } else {
      clearInterval(timerRef.current);
      await deviceMaster.stopFraming();
      setProgress(completed ? 100 : 0);
      setIsTesting(false);
    }
  };

  const completeTest = async () => {
    clearInterval(timerRef.current);
    await togglePreview(true);

    const { disconnection } = await deviceMaster.getReport();

    if (typeof disconnection === 'number' && disconnection >= 0) {
      setResult(Math.min(disconnection, worst));
    } else {
      setResult(worst);
    }
  };

  useEffect(() => {
    if (progress === 100) {
      completeTest();
    }
  }, [progress]);

  const passed = useMemo(() => result < 2, [result]);

  return (
    <Modal centered footer={null} keyboard={false} maskClosable={false} onCancel={onClose} open title={t.title}>
      <div className={styles.container}>
        <div>{t.description}</div>
        <Progress className={styles.progress} percent={progress} />
        {Number.isNaN(result) || (
          <div>
            <span className={styles.label}>{t.health}</span>
            <span className={passed ? styles.good : styles.bad}> {t[results[result]]}</span>
            {passed ? <div>{t.healthy_description}</div> : <div className={styles.bad}>{t.unhealthy_description}</div>}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <Button onClick={onClose}>{tGlobal.cancel}</Button>
        <Button onClick={() => togglePreview()} type="primary">
          {isTesting ? t.stop : Number.isNaN(result) ? t.start : t.restart}
        </Button>
      </div>
    </Modal>
  );
};

export default ConnectionTest;
