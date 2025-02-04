import React, { useEffect, useMemo, useState } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import FieldBlock from '@core/app/components/dialogs/promark/FieldBlock';
import LensBlock from '@core/app/components/dialogs/promark/LensBlock';
import RedDotBlock from '@core/app/components/dialogs/promark/RedDotBlock';
import { defaultField, defaultGalvoParameters, defaultRedLight } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import { getSerial } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';

import styles from './index.module.scss';

export default function PromarkSettings(): React.JSX.Element {
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

    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />

      <Flex justify="space-between" style={{ width: 560 }}>
        <div>
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
