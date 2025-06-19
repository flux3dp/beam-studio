import React, { useContext } from 'react';

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
  const lang = useI18n().topbar.menu;
  const { selectedDevice } = useContext(CanvasContext);

  lang;

  const onClick = async () => {
    try {
      const deviceStatus = await checkDeviceStatus(selectedDevice!);

      if (!deviceStatus) {
        alertCaller.popUp({
          caption: 'Auto Focus',
          message: 'Please select a device before auto focusing.',
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
            caption: 'Auto Focus',
            message: 'Please show the probe before auto focusing.',
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
        message: 'Auto focusing...',
      });

      await deviceMaster.enterRawMode();
      await deviceMaster.rawAutoFocus();
      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    } finally {
      progressCaller.popById('auto-focus');
    }
  };

  return (
    <div
      className={classNames(styles.button, {
        [styles.disabled]:
          selectedDevice === null ||
          (!constants.fcodeV2Models.has(selectedDevice.model) && selectedDevice.model !== 'fhexa1'),
      })}
      onClick={onClick}
      title={'Auto Focus'}
    >
      <TopBarIcons.AutoFocus />
    </div>
  );
};

export default AutoFocusButton;
