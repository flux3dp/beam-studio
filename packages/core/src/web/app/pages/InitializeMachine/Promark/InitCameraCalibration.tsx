import React, { useCallback, useEffect, useMemo } from 'react';

import { popDialogById } from '@core/app/actions/dialog-controller';
import type { RenderWrapper } from '@core/app/components/dialogs/camera/common/types';
import PromarkCalibration from '@core/app/components/dialogs/camera/PromarkCalibration';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import { getSerial } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import { getHomePage } from '@core/helpers/hashHelper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import SetupPageLayout from '../Components/SetupPageLayout';

import styles from './InitCameraCalibration.module.scss';

export default function InitCameraCalibration(): React.JSX.Element {
  const serial = useMemo(getSerial, []);
  const model = useMemo(() => deviceMaster.currentDevice?.info?.model ?? 'fpm1', []);
  const device = useMemo(() => ({ model, serial }) as IDeviceInfo, [model, serial]);
  const currentData = useMemo(() => promarkDataStore.get(serial, 'cameraParameters'), [serial]);

  // Clear the loading window opened by PromarkSettings to bridge the async hash navigation.
  useEffect(() => {
    popDialogById('loading-window');
  }, []);

  const onClose = useCallback((completed?: boolean) => {
    if (completed) {
      window.location.hash = getHomePage();
      window.location.reload();
    } else {
      window.history.back();
    }
  }, []);

  const renderWrapper: RenderWrapper = useCallback(
    ({ buttons, content, media, title }) => (
      <SetupPageLayout buttons={buttons}>
        {media && <div className={styles.mediaColumn}>{media}</div>}
        <div className={styles.textColumn}>
          {title && <div className={styles.title}>{title}</div>}
          {content}
        </div>
      </SetupPageLayout>
    ),
    [],
  );

  return (
    <PromarkCalibration
      currentData={currentData}
      device={device}
      onBack={() => window.history.back()}
      onClose={onClose}
      renderWrapper={renderWrapper}
    />
  );
}
