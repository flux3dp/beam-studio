import React, { useCallback, useContext, useMemo } from 'react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setupPreviewMode } from '@core/app/stores/canvas/utils/previewMode';
import getDevice from '@core/helpers/device/get-device';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './SelectMachineButton.module.scss';

function SelectMachineButton(): React.JSX.Element {
  const isMobile = useIsMobile();
  const i18n = useI18n();
  const mode = useCanvasStore((state) => state.mode);
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

  const handleClick = useCallback(() => {
    if (mode !== CanvasMode.Preview) {
      getDevice(true);
    } else {
      setupPreviewMode({ showModal: true });
    }
  }, [mode]);

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
