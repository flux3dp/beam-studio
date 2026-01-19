import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowDownOutlined, ArrowUpOutlined, LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Spin, Tooltip } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import deviceConstants from '@core/app/constants/device-constants';
import Icons from '@core/app/icons/icons';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { generateCalibrationTaskString, loadTaskToSwiftray } from '@core/helpers/device/promark/calibration';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import type { MarkParameters } from './ParametersBlock';
import ParametersBlock from './ParametersBlock';
import styles from './ZAxisAdjustment.module.scss';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
}

export const ZAxisAdjustment = ({ device, onClose }: Props): React.JSX.Element => {
  const { global: tGlobal, monitor: tMonitor, promark_settings: t } = useI18n();
  const { model } = device;
  const isInch = useStorageStore((state) => state.isInch);
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
      markTask.current = await generateCalibrationTaskString({ power, speed, width: 10 });
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
    try {
      await deviceMaster.doPromarkCalibration();
    } catch (err) {
      if (err && err[1] === 'DOOR_OPENED') {
        await deviceMaster.stop();
        alertCaller.popUp({
          buttonType: alertConstants.RETRY_CANCEL,
          id: 'DOOR_OPENED',
          message: tMonitor.HARDWARE_ERROR_DOOR_OPENED,
          onRetry: handleMark,
          type: alertConstants.SHOW_POPUP_ERROR,
        });
      }
    }
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
    <Flex align="center" className={styles.footer} justify="space-between">
      <div>
        <Button className={styles.button} disabled={isMoving} onClick={handlePreview}>
          {tGlobal.preview}
          {isPreviewing ? (
            <Spin indicator={<LoadingOutlined className={styles.icon} spin />} />
          ) : (
            <Icons.Play className={styles.icon} />
          )}
        </Button>
        <Button className={styles.button} disabled={isMoving} onClick={handleMark}>
          {t.mark}
        </Button>
      </div>
      <Button className={styles.button} onClick={handleClose} type="primary">
        {tGlobal.ok}
      </Button>
    </Flex>
  );

  return (
    <Modal
      centered
      footer={footer}
      maskClosable={false}
      onCancel={handleClose}
      open
      title={t.z_axis_adjustment.title}
      width={425}
    >
      <div className={styles.container}>
        <div className={styles['mb-12']}>{t.z_axis_adjustment.section1}</div>
        <Flex className={styles['mb-28']} gap={8} justify="flex-start">
          <Button disabled={isMoving} icon={<ArrowUpOutlined />} onClick={() => handleMove(zAxis)} />
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            isInch={isInch}
            max={100}
            min={1}
            onChange={(value) => setZAxis(Math.min(100, Math.max(1, value)))}
            precision={isInch ? 6 : 2}
            step={isInch ? 25.4 : 1}
            value={zAxis}
          />
          <Button disabled={isMoving} icon={<ArrowDownOutlined />} onClick={() => handleMove(-zAxis)} />
          <Button className={styles.button} danger disabled={!isMoving} onClick={handleStop}>
            {tGlobal.stop}
          </Button>
        </Flex>
        <Flex className={styles['mb-12']} justify="flex-start">
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

  if (!device) {
    return;
  }

  await deviceMaster.select(device);

  const res = await checkDeviceStatus(device);

  if (!res) {
    return;
  }

  if (!isIdExist(id)) {
    addDialogComponent(id, <ZAxisAdjustment device={device} onClose={() => popDialogById(id)} />);
  }
};
