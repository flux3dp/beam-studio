import React, { use, useCallback, useMemo, useState } from 'react';

import { DisconnectOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { getMouseMode, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useIsMobile } from '@core/app/stores/screenStore';
import { checkHexa2GalvoDev } from '@core/helpers/checkFeature';
import getDevice from '@core/helpers/device/get-device';
import deviceMaster from '@core/helpers/device-master';
import { useDeviceList } from '@core/helpers/hooks/useDeviceList';
import useI18n from '@core/helpers/useI18n';

import styles from './SelectMachineButton.module.scss';

function SelectMachineButton(): React.JSX.Element {
  const isMobile = useIsMobile();
  const i18n = useI18n();
  const { selectedDevice } = use(CanvasContext);
  const devices = useDeviceList('select-machine-button');
  // deviceMaster is not reactive, and this component renders before the selection it triggered has
  // finished connecting. Bumped once that await returns, so the state below is read again.
  const [selectionTick, setSelectionTick] = useState(0);

  /**
   * HEXA II development only, to tell at a glance whether the machine-held settings on screen were
   * ever read from a machine. The selected device survives a reload and can name one this session
   * has never reached, so two things have to hold: discovery still sees it, and the control socket
   * we hold is that machine's and still open. Goes away with the rest of the HEXA II work-range
   * scaffolding; see helpers/device/galvoWorkRange.
   *
   * Behind fhx2galvo-dev rather than dev, because the indicator is about every machine and would
   * otherwise sit in the toolbar of sessions that have nothing to do with a machine being measured.
   */
  const showDisconnected = useMemo(() => {
    if (!checkHexa2GalvoDev() || !selectedDevice) return false;

    const { currentDevice } = deviceMaster;
    const isConnected =
      devices.some((device) => device.uuid === selectedDevice.uuid) &&
      currentDevice?.info.uuid === selectedDevice.uuid &&
      Boolean(currentDevice.control?.isConnected);

    return !isConnected;
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [devices, selectedDevice, selectionTick]);
  const text = useMemo(() => {
    if (isMobile) {
      return '';
    }

    if (selectedDevice) {
      return selectedDevice.name;
    }

    return i18n.topbar.select_machine;
  }, [isMobile, selectedDevice, i18n]);

  const handleClick = useCallback(async () => {
    const { device } = await getDevice(true);

    setSelectionTick((tick) => tick + 1);

    if (device && device.uuid !== selectedDevice?.uuid) {
      if (previewModeController.isPreviewMode) {
        previewModeController.end();
      } else if (getMouseMode() === 'pre_preview') {
        setMouseMode('select');
      }
    }
  }, [selectedDevice]);

  return (
    <div className={styles.button} onClick={handleClick}>
      <TopBarIcons.SelectMachine />
      {!isMobile && (
        <span className={styles.text} data-testid="select-machine">
          {text}
        </span>
      )}
      {showDisconnected && (
        <Tooltip title="尚未與這台機器連線，畫面上來自機器的設定可能不是最新的">
          <DisconnectOutlined className={styles.disconnected} data-testid="disconnected" />
        </Tooltip>
      )}
    </div>
  );
}

export default SelectMachineButton;
