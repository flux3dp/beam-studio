import React, { useMemo, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Flex } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import FieldBlock from '@core/app/components/dialogs/promark/FieldBlock';
import LensBlock from '@core/app/components/dialogs/promark/LensBlock';
import LensProfileBlock from '@core/app/components/dialogs/promark/LensProfileBlock';
import RedDotBlock from '@core/app/components/dialogs/promark/RedDotBlock';
import { confirmLensWarnings, useLensProfiles } from '@core/app/components/dialogs/promark/useLensProfiles';
import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import { normalizeLensProfileKey, resolveLensProfile } from '@core/helpers/device/promark/lens-profiles';
import { uploadLensCloudData } from '@core/helpers/device/promark/lens-profiles-cloud';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import { getPromarkInfo, getSerial } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import { getHomePage } from '@core/helpers/hashHelper';
import useI18n from '@core/helpers/useI18n';
import type { LensProfileKey } from '@core/interfaces/Promark';

import SetupPageLayout from '../Components/SetupPageLayout';
import showSetupPageLayoutDialog from '../Components/showSetupPageLayoutDialog';

import styles from './PromarkSettings.module.scss';

export default function PromarkSettings(): React.JSX.Element {
  const { initialize: t } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const [serial, hashedSerial] = useMemo(() => {
    const _serial = getSerial();
    const devices = deviceMaster.getAvailableDevices();
    const device = devices.find((d) => d.serial === _serial);

    return [_serial, device?.hashed_serial];
  }, []);
  const { width } = useMemo(() => getWorkarea('fpm1'), []);
  const info = useMemo(() => getPromarkInfo(), []);
  const [store] = useState(() => promarkDataStore.get(serial));
  // the work area picked on the previous page is shown first and becomes the default lens
  const initialKey = useMemo<LensProfileKey>(
    () => normalizeLensProfileKey(info.laserType, { innerEngraving: false, workarea: width }),
    [info.laserType, width],
  );
  const lens = useLensProfiles({ hashedSerial, info, initialDefaultKey: initialKey, initialKey, serial, store });

  const handleUpdateParameter = async (): Promise<boolean> => {
    if (!(await confirmLensWarnings(lens.getSaveWarnings(), info.laserType, isInch))) return false;

    const saved = lens.save();
    const applied = resolveLensProfile(saved, initialKey, info.laserType);

    try {
      await deviceMaster.setField(width, applied.field ?? defaultField);
      await deviceMaster.setGalvoParameters(applied.galvoParameters ?? defaultGalvoParameters);
    } catch (error) {
      console.error('Failed to apply promark settings state', error);
    }

    await uploadLensCloudData({ hash: hashedSerial, info, model: 'fpm1', serial, store: saved });

    return true;
  };

  const handleNext = async () => {
    if (!(await handleUpdateParameter())) return;

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
        { disabled: lens.invalidProfiles.length > 0, label: t.next, onClick: handleNext, primary: true },
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
          <LensProfileBlock
            canUseCloud={lens.canUseCloud}
            info={info}
            invalidProfiles={lens.invalidProfiles}
            isDefault={lens.isDefault}
            isSynced={lens.isSynced}
            onChange={lens.changeLens}
            onSetDefault={lens.setAsDefault}
            onUseCloud={lens.applyCloudParameters}
            status={lens.status}
            value={lens.lensKey}
          />
          <FieldBlock field={lens.field} isInch={isInch} issues={lens.issues} setField={lens.setField} />
          <RedDotBlock isInch={isInch} issues={lens.issues} redDot={lens.redDot} setRedDot={lens.setRedDot} />
          <LensBlock data={lens.galvoParameters} issues={lens.issues} setData={lens.setGalvoParameters} />
        </div>
      </Flex>
    </SetupPageLayout>
  );
}
