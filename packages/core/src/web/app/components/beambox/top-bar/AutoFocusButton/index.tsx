import React, { useContext, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import {
  dpmm,
  needToShowProbeBeforeAutoFocusModelsArray,
  supportAutoFocusModels,
} from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import alertConfig from '@core/helpers/api/alert-config';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { useAutoFocusPinning } from './hooks/useAutoFocusPinning';
import styles from './index.module.scss';
import { getMovementSpeed } from './utils/getMovementSpeed';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

type Props = {
  toggleAutoFocus: (forceState?: boolean) => void;
};

const AutoFocusButton = ({ toggleAutoFocus }: Props): React.JSX.Element => {
  const {
    alert,
    global,
    message,
    topbar: {
      menu: { autofocus: lang },
    },
  } = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const isDeviceSupportAutoFocus = useMemo(
    () => supportAutoFocusModels.has(selectedDevice?.model || 'none'),
    [selectedDevice],
  );
  const { autoFocusOffset: [offsetX, offsetY] = [0, 0, 0], height, width } = getWorkarea(selectedDevice?.model!);
  const executeAutofocus = async (coords?: { x: number; y: number }) => {
    if (isProcessing) return;

    const model = selectedDevice?.model!;

    try {
      setIsProcessing(true);
      progressCaller.openNonstopProgress({ id: 'auto-focus', message: lang.operating });

      const _f = getMovementSpeed(model);

      // If coordinates were provided by the pin, move the device head first.
      if (coords) {
        const x = Math.max(offsetX, Math.min(coords.x / dpmm - offsetX, width - offsetX));
        const y = Math.max(offsetY, Math.min(coords.y / dpmm - offsetY, height - offsetY));

        await deviceMaster.rawMove({ x, y });
      }

      await deviceMaster.rawAutoFocus();
      await deviceMaster.rawLooseMotor();
    } finally {
      await deviceMaster.endSubTask();
      await deviceMaster.kick();
      progressCaller.popById('auto-focus');
      setIsProcessing(false);
      toggleAutoFocus(false);
    }
  };

  const { isPinning, startPinning, stopPinning } = useAutoFocusPinning(executeAutofocus, toggleAutoFocus);

  /**
   * Handles clicks on the auto focus button.
   */
  const handleClickButton = async () => {
    if (isProcessing) return;

    // If already in pinning mode, clicking the button cancels it.
    if (isPinning) {
      stopPinning();

      return;
    }

    if (!alertConfig.read('skip_auto_focus_warning')) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttonLabels: [global.cancel, message.camera.continue_preview],
          callbacks: [() => resolve(false), () => resolve(true)],
          checkbox: {
            callbacks: () => alertConfig.write('skip_auto_focus_warning', true),
            text: alert.dont_show_again,
          },
          id: 'camera_cable_alert',
          message:
            'After entering auto focus mode, the laser head will be reset and moved to the specified position for focusing. \nPlease ensure that the target position is on the material and that there are no obstacles in the movement path.',
          primaryButtonIndex: 1,
          type: alertConstants.SHOW_POPUP_WARNING,
        });
      });

      if (!shouldContinue) return;
    }

    setIsProcessing(true);

    const deviceStatus = await checkDeviceStatus(selectedDevice!);

    if (!deviceStatus) {
      alertCaller.popUp({
        caption: lang.title,
        message: lang.select_device_error,
        type: alertConstants.SHOW_POPUP_ERROR,
      });
      setIsProcessing(false);

      return;
    }

    await deviceMaster.select(selectedDevice!);

    const prerequisite = await match(selectedDevice)
      .with(null, () => false)
      .with({ model: P.union(...needToShowProbeBeforeAutoFocusModelsArray) }, async () => {
        const { probe_showed } = await deviceMaster.getDeviceDetailInfo();

        if (probe_showed === '1') return true;

        alertCaller.popUp({
          caption: lang.title,
          message: lang.show_probe_error,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return false;
      })
      .otherwise(() => true);
    const setupDevice = async () => {
      try {
        progressCaller.openNonstopProgress({ id: 'auto-focus', message: message.homing });

        progressCaller.update('auto-focus', { message: message.enteringRawMode });
        await deviceMaster.enterRawMode();
        progressCaller.update('auto-focus', { message: message.exitingRotaryMode });
        await deviceMaster.rawSetRotary(false);
        progressCaller.update('auto-focus', { message: message.homing });
        await deviceMaster.rawHome();

        if (selectedDevice?.model === 'fhexa1') {
          await deviceMaster.rawUnlock();
        }
      } finally {
        progressCaller.popById('auto-focus');
      }
    };

    setIsProcessing(false); // End of pre-flight checks

    if (prerequisite) {
      svgCanvas.clearSelection();
      toggleAutoFocus(true);
      await setupDevice();
      startPinning(); // If all checks pass, enter pinning mode.
    }
  };

  useEffect(() => {
    console.log(isProcessing, isPinning);
  }, [isProcessing, isPinning]);

  return (
    <div
      className={classNames(styles.button, {
        [styles.disabled]: isProcessing || !isDeviceSupportAutoFocus || isPinning || mode === CanvasMode.Preview,
      })}
      onClick={handleClickButton}
      title={lang.title}
    >
      <TopBarIcons.AutoFocus />
    </div>
  );
};

export default AutoFocusButton;
