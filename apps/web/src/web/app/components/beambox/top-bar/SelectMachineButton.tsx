import React, { useCallback, useContext, useMemo } from 'react';

import getDevice from 'helpers/device/get-device';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { useIsMobile } from 'helpers/system-helper';

import styles from './SelectMachineButton.module.scss';

function SelectMachineButton(): JSX.Element {
  const isMobile = useIsMobile();
  const i18n = useI18n();
  const { mode, selectedDevice, setupPreviewMode } = useContext(CanvasContext);
  const text = useMemo(() => {
    if (isMobile) return '';
    if (selectedDevice) return selectedDevice.name;
    return i18n.topbar.select_machine;
  }, [isMobile, selectedDevice, i18n]);

  const handleClick = useCallback(() => {
    if (mode !== CanvasMode.Preview) getDevice(true);
    else setupPreviewMode({ showModal: true });
  }, [mode, setupPreviewMode]);

  return (
    <div className={styles.button} onClick={handleClick}>
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
