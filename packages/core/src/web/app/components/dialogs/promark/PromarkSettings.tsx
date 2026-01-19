import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Spin } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import { defaultField, defaultGalvoParameters, defaultRedLight } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import icons from '@core/app/icons/icons';
import { useStorageStore } from '@core/app/stores/storageStore';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import checkDeviceStatus from '@core/helpers/check-device-status';
import applyRedDot from '@core/helpers/device/promark/apply-red-dot';
import { generateCalibrationTaskString, loadTaskToSwiftray } from '@core/helpers/device/promark/calibration';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { Field, GalvoParameters, PromarkStore, RedDot } from '@core/interfaces/Promark';

import blockStyles from './Block.module.scss';
import FieldBlock from './FieldBlock';
import LensBlock from './LensBlock';
import type { MarkParameters } from './ParametersBlock';
import ParametersBlock from './ParametersBlock';
import styles from './PromarkSettings.module.scss';
import RedDotBlock from './RedDotBlock';

interface Props {
  device: IDeviceInfo;
  initData: PromarkStore;
  onClose: () => void;
}

const PromarkSettings = ({ device, initData, onClose }: Props): React.JSX.Element => {
  const { global: tGlobal, monitor: tMonitor, promark_settings: t } = useI18n();
  const { model, serial } = device;
  const isInch = useStorageStore((state) => state.isInch);
  const [field, setField] = useState<Field>(initData.field || defaultField);
  const [redDot, setRedDot] = useState<RedDot>(initData.redDot || defaultRedLight);
  const [galvoParameters, setGalvoCorrection] = useState<GalvoParameters>(
    initData.galvoParameters || defaultGalvoParameters,
  );
  const [parameters, setParameters] = useState<MarkParameters>({ power: 50, speed: 1000 });
  const { power, speed } = parameters;
  const { width } = useMemo(() => getWorkarea(model), [model]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewTask = useRef<string>('');
  const markTask = useRef<string>('');

  useEffect(() => {
    previewTask.current = '';
  }, [redDot, width]);

  const uploadPreviewTask = useCallback(async () => {
    if (!previewTask.current) {
      previewTask.current = await generateCalibrationTaskString({ width });
    }

    await loadTaskToSwiftray(previewTask.current, model);
  }, [model, width]);

  useEffect(() => {
    markTask.current = '';
  }, [width, power, speed]);

  const uploadMarkTask = useCallback(async () => {
    if (!markTask.current) {
      markTask.current = await generateCalibrationTaskString({ power, speed, width });
    }

    await loadTaskToSwiftray(markTask.current, model);
  }, [model, width, power, speed]);

  const handleUpdateParameter = async (shouldApplyRedDot = false) => {
    if (shouldApplyRedDot) {
      const { field: newField, galvoParameters: newGalvo } = applyRedDot(redDot, field, galvoParameters);

      await deviceMaster.setField(width, newField);
      await deviceMaster.setGalvoParameters(newGalvo);
    } else {
      await deviceMaster.setField(width, field);
      await deviceMaster.setGalvoParameters(galvoParameters);
    }
  };

  useEffect(() => {
    const abortPreview = () => setIsPreviewing(false);

    swiftrayClient.on('disconnected', abortPreview);

    return () => {
      swiftrayClient.off('disconnected', abortPreview);
    };
  }, []);

  const handlePreview = async () => {
    if (!isPreviewing) {
      await uploadPreviewTask();
      await handleUpdateParameter(true);
      await deviceMaster.startFraming();
      setIsPreviewing(true);
    } else {
      await deviceMaster.stopFraming();
      setIsPreviewing(false);
    }
  };

  const handleMark = async () => {
    if (isPreviewing) {
      await deviceMaster.stopFraming();
      setIsPreviewing(false);
      // Wait 0.5s to ensure stop before start in swiftray
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await uploadMarkTask();
    await handleUpdateParameter();
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

  const handleSave = async () => {
    promarkDataStore.update(serial, { field, galvoParameters, redDot });
    try {
      if (isPreviewing) {
        await deviceMaster.stopFraming();
      }

      await handleUpdateParameter();
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }
    onClose();
  };

  const handleCancel = () => {
    const restore = async () => {
      try {
        if (isPreviewing) {
          await deviceMaster.stopFraming();
        }

        await deviceMaster.setField(width, initData.field || { angle: 0, offsetX: 0, offsetY: 0 });
        await deviceMaster.setGalvoParameters(
          initData.galvoParameters || {
            x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
            y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
          },
        );
      } catch (err) {
        console.error('Failed to restore from promark settings state', err);
      }
    };

    restore();
    onClose();
  };

  const footer = (
    <Flex align="center" className={styles.footer} justify="space-between">
      <Flex align="center" gap={8}>
        <Button className={styles.button} onClick={handlePreview}>
          {tGlobal.preview}
          {isPreviewing ? (
            <Spin indicator={<LoadingOutlined className={styles.icon} spin />} />
          ) : (
            <icons.Play className={styles.icon} />
          )}
        </Button>
        <Button className={styles.button} onClick={handleMark}>
          {t.mark}
        </Button>
      </Flex>
      <Flex align="center" gap={8}>
        <Button className={styles.button} onClick={handleCancel}>
          {tGlobal.cancel}
        </Button>
        <Button className={styles.button} onClick={handleSave} type="primary">
          {tGlobal.save}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      centered
      footer={footer}
      keyboard={false}
      maskClosable={false}
      onCancel={handleCancel}
      open
      title={t.title}
      width={620}
    >
      <div className={styles.container}>
        <FieldBlock field={field} isInch={isInch} setField={setField} width={width} />
        <RedDotBlock isInch={isInch} redDot={redDot} setRedDot={setRedDot} />
        <LensBlock data={galvoParameters} setData={setGalvoCorrection} />
        <Flex align="center" className={blockStyles['full-row']} gap={8} justify="space-between">
          <div className={blockStyles.title}>{t.mark_parameters}</div>
          <ParametersBlock isInch={isInch} parameters={parameters} setParameters={setParameters} />
        </Flex>
      </div>
    </Modal>
  );
};

export const showPromarkSettings = async (device: IDeviceInfo): Promise<void> => {
  await deviceMaster.select(device);

  const res = await checkDeviceStatus(device);

  if (!res) {
    return;
  }

  const { serial } = device;
  const data = promarkDataStore.get(serial);
  const id = 'promark-settings';

  if (!isIdExist(id)) {
    addDialogComponent(id, <PromarkSettings device={device} initData={data} onClose={() => popDialogById(id)} />);
  }
};

export default PromarkSettings;
