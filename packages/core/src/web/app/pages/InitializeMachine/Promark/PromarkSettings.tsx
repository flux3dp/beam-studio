import React, { useEffect, useMemo, useState } from 'react';

import { Flex } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import FieldBlock from '@core/app/components/dialogs/promark/FieldBlock';
import LensBlock from '@core/app/components/dialogs/promark/LensBlock';
import RedDotBlock from '@core/app/components/dialogs/promark/RedDotBlock';
import { defaultField, defaultGalvoParameters, defaultRedLight } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import { getSerial } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import { getHomePage } from '@core/helpers/hashHelper';
import useI18n from '@core/helpers/useI18n';

import SetupPageLayout from '../Components/SetupPageLayout';

import styles from './PromarkSettings.module.scss';

export default function PromarkSettings(): React.JSX.Element {
  const { initialize: t } = useI18n();
  const [field, setField] = useState(defaultField);
  const [redDot, setRedDot] = useState(defaultRedLight);
  const [galvoParameters, setGalvoParameters] = useState(defaultGalvoParameters);

  const isInch = useStorageStore((state) => state.isInch);
  const serial = useMemo(getSerial, []);
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
  }, [serial]);

  const handleUpdateParameter = async () => {
    await deviceMaster.setField(width, field);
    await deviceMaster.setGalvoParameters(galvoParameters);
  };

  const handleNext = async () => {
    promarkDataStore.update(serial, { field, galvoParameters, redDot });

    try {
      await handleUpdateParameter();
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }

    dialogCaller.showLoadingWindow();

    window.location.hash = getHomePage();
    window.location.reload();
  };

  return (
    <SetupPageLayout
      buttons={[
        { label: t.back, onClick: () => window.history.back() },
        { label: t.connect_machine_ip.finish_setting, onClick: handleNext, primary: true },
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
