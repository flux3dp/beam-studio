import React, { useContext } from 'react';

import classNames from 'classnames';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import constants from '@core/app/actions/beambox/constant';
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
    await match(selectedDevice)
      .with(null, () => {})
      .with({ model: 'fhexa1' }, async () => {
        await deviceMaster.rawAutoFocus();
      })
      .with({ model: 'ado1' }, async () => {
        await deviceMaster.rawAutoFocus();
      })
      .with({ model: 'fbb2' }, async (device) => {
        if (device.probe_showed) {
          alertCaller.popUp({
            caption: 'Auto Focus',
            message: 'Please show the probe before auto focusing.',
            type: alertConstants.SHOW_POPUP_ERROR,
          });

          // await deviceMaster.showProbe();
          return;
        }

        const deviceStatus = await checkDeviceStatus(device);

        if (!deviceStatus) {
          return;
        }

        await deviceMaster.select(device);

        console.log(deviceMaster.currentDevice);
        await deviceMaster.enterRawMode();
        await deviceMaster.rawAutoFocus();
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endSubTask();
      })
      .otherwise(() => {});
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
