import React, { useContext, useMemo, useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import constants, { needToShowProbeBeforeAutoFocusModelsArray } from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';

import styles from './AutoFocusButton.module.scss';

const AutoFocusButton = (): React.JSX.Element => {
  const {
    topbar: {
      menu: { autofocus: lang },
    },
  } = useI18n();
  const { selectedDevice } = useContext(CanvasContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const onClick = async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      const deviceStatus = await checkDeviceStatus(selectedDevice!);

      if (!deviceStatus) {
        alertCaller.popUp({
          caption: lang.title,
          message: lang.select_device_error,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return;
      }

      await deviceMaster.select(selectedDevice!);

      const prerequisite = await match(selectedDevice)
        .with(null, () => false)
        .with({ model: P.union(...needToShowProbeBeforeAutoFocusModelsArray) }, async () => {
          const { probe_showed } = await deviceMaster.getDeviceDetailInfo();

          if (probe_showed === '1') {
            return true;
          }

          alertCaller.popUp({
            caption: lang.title,
            message: lang.show_probe_error,
            type: alertConstants.SHOW_POPUP_ERROR,
          });

          return false;
        })
        .otherwise(() => true);

      if (!prerequisite) {
        return;
      }

      progressCaller.openNonstopProgress({
        id: 'auto-focus',
        message: lang.operating,
      });

      await deviceMaster.enterRawMode();

      if (selectedDevice?.model === 'fhexa1') {
        await deviceMaster.rawUnlock();
      }

      await deviceMaster.rawAutoFocus();
      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    } finally {
      progressCaller.popById('auto-focus');
      setIsProcessing(false);
    }
  };
  const deviceSupportAF = useMemo(() => {
    if (!selectedDevice) return false;

    return (
      selectedDevice.model === 'fhexa1' ||
      (constants.fcodeV2Models.has(selectedDevice.model) && selectedDevice.model !== 'fbm2')
    );
  }, [selectedDevice]);

  return (
    <div
      className={classNames(styles.button, { [styles.disabled]: isProcessing || !deviceSupportAF })}
      onClick={onClick}
      title={lang.title}
    >
      <TopBarIcons.AutoFocus />
    </div>
  );
};

export default AutoFocusButton;
