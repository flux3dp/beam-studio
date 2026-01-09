import React, { useCallback, useContext, useMemo } from 'react';

import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import getDevice from '@core/helpers/device/get-device';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './SelectMachineButton.module.scss';

function SelectMachineButton(): React.JSX.Element {
  const isMobile = useIsMobile();
  const i18n = useI18n();
  const { selectedDevice } = useContext(CanvasContext);
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

    if (previewModeController.isPreviewMode && device && device.uuid !== selectedDevice?.uuid) {
      previewModeController.end();
    }
  }, [selectedDevice]);

  return (
    <div className={styles.button} data-tutorial="select-machine-button" onClick={handleClick}>
      <TopBarIcons.SelectMachine />
      {!isMobile && (
        <span className={styles.text} data-testid="select-machine">
          {text}
        </span>
      )}
    </div>
  );
}

export default SelectMachineButton;
