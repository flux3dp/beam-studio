/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useMemo, useState } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import useI18n from 'helpers/useI18n';
import deviceMaster from 'helpers/device-master';
import {
  defaultField,
  defaultGalvoParameters,
  defaultRedLight,
} from 'app/constants/promark-constants';
import storage from 'implementations/storage';
import FieldBlock from 'app/components/dialogs/promark/FieldBlock';
import RedDotBlock from 'app/components/dialogs/promark/RedDotBlock';
import LensBlock from 'app/components/dialogs/promark/LensBlock';
import dialogCaller from 'app/actions/dialog-caller';
import promarkDataStore from 'helpers/device/promark/promark-data-store';
import { getWorkarea } from 'app/constants/workarea-constants';
import { getSerial } from 'helpers/device/promark/promark-info';

import styles from './index.module.scss';

export default function PromarkSettings(): JSX.Element {
  const { initialize: t } = useI18n();
  const [field, setField] = useState(defaultField);
  const [redDot, setRedDot] = useState(defaultRedLight);
  const [galvoParameters, setGalvoParameters] = useState(defaultGalvoParameters);

  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const serial = useMemo(getSerial, []);
  const { width } = useMemo(() => getWorkarea('fpm1'), []);

  useEffect(() => {
    const {
      field = defaultField,
      redDot = defaultRedLight,
      galvoParameters = defaultGalvoParameters,
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
    promarkDataStore.update(serial, { field, redDot, galvoParameters });

    try {
      await handleUpdateParameter();
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }

    dialogCaller.showLoadingWindow();

    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />

      <Flex justify="space-between" style={{ width: 560 }}>
        <div>
          <div className={styles.title}>{t.promark.settings}</div>

          <Flex vertical gap={12}>
            <div className={styles.subtitle}>{t.promark.qc_instructions}</div>
            <div className={styles.text}>{t.promark.configuration_confirmation}</div>
            <div className={styles.text}>{t.promark.or_complete_later}</div>
          </Flex>

          <div className={styles['table-container']}>
            {width && (
              <FieldBlock width={width} isInch={isInch} field={field} setField={setField} />
            )}
            <RedDotBlock isInch={isInch} redDot={redDot} setRedDot={setRedDot} />
            <LensBlock data={galvoParameters} setData={setGalvoParameters} />
          </div>
        </div>
      </Flex>

      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {t.back}
        </div>
        <div className={classNames(styles.btn, styles.primary)} onClick={handleNext}>
          {t.connect_machine_ip.finish_setting}
        </div>
      </div>
    </div>
  );
}
