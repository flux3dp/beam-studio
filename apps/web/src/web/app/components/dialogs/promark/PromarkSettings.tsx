import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, Modal, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import applyRedDot from 'helpers/device/promark/apply-red-dot';
import checkDeviceStatus from 'helpers/check-device-status';
import deviceMaster from 'helpers/device-master';
import icons from 'app/icons/icons';
import promarkDataStore from 'helpers/device/promark/promark-data-store';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import {
  defaultField,
  defaultGalvoParameters,
  defaultRedLight,
} from 'app/constants/promark-constants';
import { Field, GalvoParameters, PromarkStore, RedDot } from 'interfaces/Promark';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';
import {
  generateCalibrationTaskString,
  loadTaskToSwiftray,
} from 'helpers/device/promark/calibration';
import { swiftrayClient } from 'helpers/api/swiftray-client';

import FieldBlock from './FieldBlock';
import LensBlock from './LensBlock';
import ParametersBlock, { MarkParameters } from './ParametersBlock';
import RedDotBlock from './RedDotBlock';
import styles from './PromarkSettings.module.scss';
import blockStyles from './Block.module.scss';

interface Props {
  device: IDeviceInfo;
  initData: PromarkStore;
  onClose: () => void;
}

const PromarkSettings = ({ device, initData, onClose }: Props): JSX.Element => {
  const { global: tGlobal, promark_settings: t } = useI18n();
  const { model, serial } = device;
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const [field, setField] = useState<Field>(initData.field || defaultField);
  const [redDot, setRedDot] = useState<RedDot>(initData.redDot || defaultRedLight);
  const [galvoParameters, setGalvoCorrection] = useState<GalvoParameters>(
    initData.galvoParameters || defaultGalvoParameters
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
      markTask.current = await generateCalibrationTaskString({ width, power, speed });
    }
    await loadTaskToSwiftray(markTask.current, model);
  }, [model, width, power, speed]);

  const handleUpdateParameter = async (shouldApplyRedDot = false) => {
    if (shouldApplyRedDot) {
      const { field: newField, galvoParameters: newGalvo } = applyRedDot(
        redDot,
        field,
        galvoParameters
      );
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
    await deviceMaster.doPromarkCalibration();
  };

  const handleSave = async () => {
    promarkDataStore.update(serial, { field, redDot, galvoParameters });
    try {
      if (isPreviewing) await deviceMaster.stopFraming();
      await handleUpdateParameter();
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }
    onClose();
  };

  const handleCancel = () => {
    const restore = async () => {
      try {
        if (isPreviewing) await deviceMaster.stopFraming();
        await deviceMaster.setField(width, initData.field || { offsetX: 0, offsetY: 0, angle: 0 });
        await deviceMaster.setGalvoParameters(
          initData.galvoParameters || {
            x: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
            y: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
          }
        );
      } catch (err) {
        console.error('Failed to restore from promark settings state', err);
      }
    };
    restore();
    onClose();
  };

  const footer = (
    <Flex className={styles.footer} justify="space-between" align="center">
      <Flex gap={8} align="center">
        <Button className={styles.button} onClick={handlePreview}>
          {t.preview}
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
      <Flex gap={8} align="center">
        <Button className={styles.button} onClick={handleCancel}>
          {tGlobal.cancel}
        </Button>
        <Button className={styles.button} type="primary" onClick={handleSave}>
          {tGlobal.save}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      open
      centered
      maskClosable={false}
      keyboard={false}
      width={620}
      title={t.title}
      onCancel={handleCancel}
      footer={footer}
    >
      <div className={styles.container}>
        <FieldBlock width={width} isInch={isInch} field={field} setField={setField} />
        <RedDotBlock isInch={isInch} redDot={redDot} setRedDot={setRedDot} />
        <LensBlock data={galvoParameters} setData={setGalvoCorrection} />
        <Flex className={blockStyles['full-row']} justify="space-between" align="center" gap={8}>
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
  if (!res) return;
  const { serial } = device;
  const data = promarkDataStore.get(serial);
  const id = 'promark-settings';
  if (!isIdExist(id)) {
    addDialogComponent(
      id,
      <PromarkSettings device={device} initData={data} onClose={() => popDialogById(id)} />
    );
  }
};

export default PromarkSettings;
