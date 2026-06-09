import React, { useEffect, useMemo, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Flex } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import FieldBlock from '@core/app/components/dialogs/promark/FieldBlock';
import LensBlock from '@core/app/components/dialogs/promark/LensBlock';
import RedDotBlock from '@core/app/components/dialogs/promark/RedDotBlock';
import { defaultField, defaultGalvoParameters, defaultRedLight } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import { readCloudConfig, updateCloudConfig } from '@core/helpers/api/flux-id/cloudConfig';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import { getSerial } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import { getHomePage } from '@core/helpers/hashHelper';
import useI18n from '@core/helpers/useI18n';

import SetupPageLayout from '../Components/SetupPageLayout';
import showSetupPageLayoutDialog from '../Components/showSetupPageLayoutDialog';

import styles from './PromarkSettings.module.scss';

export default function PromarkSettings(): React.JSX.Element {
  const { initialize: t } = useI18n();
  const [field, setField] = useState(defaultField);
  const [redDot, setRedDot] = useState(defaultRedLight);
  const [galvoParameters, setGalvoParameters] = useState(defaultGalvoParameters);

  const isInch = useStorageStore((state) => state.isInch);
  const [serial, hashedSerial] = useMemo(() => {
    const _serial = getSerial();
    const devices = deviceMaster.getAvailableDevices();
    const device = devices.find((d) => d.serial === _serial);

    return [_serial, device?.hashed_serial];
  }, []);
  const { width } = useMemo(() => getWorkarea('fpm1'), []);

  useEffect(() => {
    const {
      field = defaultField,
      galvoParameters = defaultGalvoParameters,
      redDot = defaultRedLight,
    } = promarkDataStore.get(serial);

    setField(field);
    setRedDot(redDot);
    setGalvoParameters(galvoParameters);
    readCloudConfig({ hash: hashedSerial, key: 'promarkLens', serialNumber: serial }, (config) => {
      setField((prev) => ({ ...prev, ...config.field }));
      setRedDot((prev) => ({ ...prev, ...config.redDot }));
      setGalvoParameters((prev) => ({ ...prev, ...config.galvoParameters }));
    });
  }, [hashedSerial, serial]);

  const handleUpdateParameter = async () => {
    promarkDataStore.update(serial, { field, galvoParameters, redDot });

    try {
      await deviceMaster.setField(width, field);
      await deviceMaster.setGalvoParameters(galvoParameters);
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }

    await updateCloudConfig({
      data: { field, galvoParameters, redDot },
      hash: hashedSerial,
      key: 'promarkLens',
      model: 'fpm1',
      serialNumber: serial,
    });
  };

  const handleNext = async () => {
    await handleUpdateParameter();

    showSetupPageLayoutDialog({
      buttons: [
        {
          label: t.skip,
          onClick: () => {
            dialogCaller.showLoadingWindow();
            window.location.hash = getHomePage();
            window.location.reload();
          },
        },
        {
          label: t.next,
          onClick: () => {
            dialogCaller.showLoadingWindow();
            window.location.hash = '#/initialize/connect/promark/camera-calibration';
          },
          primary: true,
        },
      ],
      children: (
        <Flex align="center" gap={24} vertical>
          <CheckCircleFilled className={styles['ask-icon']} />
          <div className={styles['ask-message']}>{t.promark.setting_completed_ask_camera_calibration}</div>
        </Flex>
      ),
    });
  };

  return (
    <SetupPageLayout
      buttons={[
        { label: t.back, onClick: () => window.history.back() },
        { label: t.next, onClick: handleNext, primary: true },
      ]}
    >
      <Flex className={styles.container} gap={24} justify="space-between" vertical>
        <div className={styles.title}>{t.promark.settings}</div>
        <Flex gap={12} vertical>
          <div className={styles.subtitle}>{t.promark.qc_instructions}</div>
          <div className={styles.text}>{t.promark.configuration_confirmation}</div>
          <div className={styles.text}>{t.promark.or_complete_later}</div>
        </Flex>

        <div className={styles['table-container']}>
          {width && <FieldBlock field={field} isInch={isInch} setField={setField} width={width} />}
          <RedDotBlock isInch={isInch} redDot={redDot} setRedDot={setRedDot} />
          <LensBlock data={galvoParameters} setData={setGalvoParameters} />
        </div>
      </Flex>
    </SetupPageLayout>
  );
}
