/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, Modal, Spin, Tooltip } from 'antd';

import checkDeviceStatus from 'helpers/check-device-status';
import deviceMaster from 'helpers/device-master';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { IDeviceInfo } from 'interfaces/IDevice';

import UnitInput from 'app/widgets/UnitInput';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { swiftrayClient } from 'helpers/api/swiftray-client';
import {
  generateCalibrationTaskString,
  loadTaskToSwiftray,
} from 'helpers/device/promark/calibration';
import Icons from 'app/icons/icons';
import deviceConstants from 'app/constants/device-constants';
import styles from './ZAxisAdjustment.module.scss';
import ParametersBlock, { MarkParameters } from './ParametersBlock';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
}

export const ZAxisAdjustment = ({ device, onClose }: Props): JSX.Element => {
  const { global: tGlobal, promark_settings: t } = useI18n();
  const { model } = device;
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const [zAxis, setZAxis] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [parameters, setParameters] = useState<MarkParameters>({ power: 50, speed: 1000 });
  const previewTask = useRef<string>('');
  const markTask = useRef<string>('');
  const movingTimeout = useRef<NodeJS.Timeout>();

  const waitTillNotRunning = async () => {
    await deviceMaster.waitTillStatusPredicate({
      predicate: (status) => status !== deviceConstants.status.RUNNING,
    });
  };

  const uploadPreviewTask = useCallback(async () => {
    if (!previewTask.current) {
      previewTask.current = await generateCalibrationTaskString({ width: 10 });
    }

    await loadTaskToSwiftray(previewTask.current, model);
  }, [model]);

  useEffect(() => {
    markTask.current = '';
  }, [parameters]);

  const uploadMarkTask = useCallback(async () => {
    const { power, speed } = parameters;

    if (!markTask.current) {
      markTask.current = await generateCalibrationTaskString({ width: 10, power, speed });
    }

    await loadTaskToSwiftray(markTask.current, model);
  }, [model, parameters]);

  useEffect(() => {
    const abortPreview = async () => {
      setIsPreviewing(false);
    };

    swiftrayClient.on('disconnected', abortPreview);

    return () => {
      swiftrayClient.off('disconnected', abortPreview);
    };
  }, []);

  const stopPreview = async () => {
    try {
      await deviceMaster.stopFraming();
      await waitTillNotRunning();
      setIsPreviewing(false);
    } catch (err) {
      console.error('🚀 ~ file: ZAxisAdjustment.tsx:92 ~ stopPreview ~ err:', err);
    }
  };

  const handlePreview = async () => {
    if (!isPreviewing) {
      await uploadPreviewTask();
      await deviceMaster.startFraming();
      setIsPreviewing(true);
    } else {
      await stopPreview();
    }
  };

  const handleMove = async (distance: number) => {
    const getTime = (distance: number) => (Math.abs(distance) * 1000) / 3 + 500;

    if (isPreviewing) {
      await stopPreview();
    }

    setIsMoving(true);

    await deviceMaster.adjustZAxis(distance);

    movingTimeout.current = setTimeout(() => {
      setIsMoving(false);
    }, getTime(distance));
  };

  const handleMark = async () => {
    if (isPreviewing) {
      await stopPreview();
    }

    await uploadMarkTask();
    await deviceMaster.doPromarkCalibration();
  };

  const handleStop = async () => {
    try {
      if (isMoving) {
        await deviceMaster.stop();
        await waitTillNotRunning();

        if (movingTimeout.current) {
          clearTimeout(movingTimeout.current);
          setIsMoving(false);
        }
      }
    } catch (err) {
      console.error('🚀 ~ file: ZAxisAdjustment.tsx:143 ~ handleStop ~ err:', err);
    }
  };

  const handleClose = async () => {
    await handleStop();

    if (isPreviewing) {
      await stopPreview();
    }

    onClose();
  };

  const footer = (
    <Flex className={styles.footer} justify="space-between" align="center">
      <div>
        <Button className={styles.button} onClick={handlePreview} disabled={isMoving}>
          {t.preview}
          {isPreviewing ? (
            <Spin indicator={<LoadingOutlined className={styles.icon} spin />} />
          ) : (
            <Icons.Play className={styles.icon} />
          )}
        </Button>
        <Button className={styles.button} onClick={handleMark} disabled={isMoving}>
          {t.mark}
        </Button>
      </div>
      <Button className={styles.button} type="primary" onClick={handleClose}>
        {tGlobal.ok}
      </Button>
    </Flex>
  );

  return (
    <Modal
      open
      centered
      maskClosable={false}
      width={425}
      title={t.z_axis_adjustment.title}
      onCancel={handleClose}
      footer={footer}
    >
      <div className={styles.container}>
        <div className={styles['mb-12']}>{t.z_axis_adjustment.section1}</div>
        <Flex justify="flex-start" className={styles['mb-28']} gap={8}>
          <Button
            icon={<ArrowUpOutlined />}
            disabled={isMoving}
            onClick={() => handleMove(zAxis)}
          />
          <UnitInput
            isInch={isInch}
            className={styles.input}
            value={zAxis}
            min={1}
            max={100}
            precision={isInch ? 6 : 2}
            step={isInch ? 25.4 : 1}
            addonAfter={isInch ? 'in' : 'mm'}
            onChange={(value) => setZAxis(Math.min(100, Math.max(1, value)))}
          />
          <Button
            icon={<ArrowDownOutlined />}
            disabled={isMoving}
            onClick={() => handleMove(-zAxis)}
          />
          <Button className={styles.button} danger onClick={handleStop} disabled={!isMoving}>
            {tGlobal.stop}
          </Button>
        </Flex>
        <Flex justify="flex-start" className={styles['mb-12']}>
          <div className={styles['mark-title']}>{t.mark_parameters}</div>
          <Tooltip title={t.z_axis_adjustment.tooltip1}>
            <QuestionCircleOutlined />
          </Tooltip>
        </Flex>
        <ParametersBlock isInch={isInch} parameters={parameters} setParameters={setParameters} />
      </div>
    </Modal>
  );
};

export const showZAxisAdjustment = async (device?: IDeviceInfo): Promise<void> => {
  const id = 'z-axis-adjustment';

  await deviceMaster.select(device);

  const res = await checkDeviceStatus(device);

  if (!res) {
    return;
  }

  if (!isIdExist(id)) {
    addDialogComponent(id, <ZAxisAdjustment device={device} onClose={() => popDialogById(id)} />);
  }
};
