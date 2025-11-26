import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import {
  dpmm,
  needToShowProbeBeforeAutoFocusModelsArray,
  supportAutoFocusModels,
} from '@core/app/actions/beambox/constant';
import MessageCaller from '@core/app/actions/message-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { toggleAutoFocus } from '@core/app/stores/canvas/utils/autoFocus';
import alertConfig from '@core/helpers/api/alert-config';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import { MessageLevel } from '@core/interfaces/IMessage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IPoint } from '@core/interfaces/ISVGCanvas';

import styles from './index.module.scss';

let svgCanvas: ISVGCanvas;
const autoFocusEventEmitter = eventEmitterFactory.createEventEmitter('auto-focus');

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const AutoFocusButton = (): React.JSX.Element => {
  const {
    alert,
    beambox,
    global,
    message,
    topbar: {
      menu: { autofocus: lang },
    },
  } = useI18n();
  const mode = useCanvasStore((state) => state.mode);
  const isPreviewMode = useCameraPreviewStore((state) => state.isPreviewMode);
  const { selectedDevice } = useContext(CanvasContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const isDeviceSupportAutoFocus = useMemo(
    () => supportAutoFocusModels.has(selectedDevice?.model || 'none'),
    [selectedDevice],
  );
  const { autoFocusOffset: [offsetX, offsetY] = [0, 0, 0], height, width } = getWorkarea(selectedDevice?.model!);
  const executeAutofocus = useCallback(
    async (coords?: { x: number; y: number }) => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        progressCaller.openNonstopProgress({ id: 'auto-focus', message: lang.operating });

        // If coordinates were provided by the pin, move the device head first.
        if (coords) {
          const x = Math.max(offsetX, Math.min(coords.x / dpmm - offsetX, width - offsetX));
          const y = Math.max(offsetY, Math.min(coords.y / dpmm - offsetY, height - offsetY));

          await deviceMaster.rawMove({ x, y });

          // Wait for the device to finish moving for HEXA
          if (deviceMaster.currentDevice?.info?.model === 'fhexa1') {
            await deviceMaster.rawWaitOkResponse('M9');
          }
        }

        await deviceMaster.rawAutoFocus();
        MessageCaller.openMessage({
          content: message.auto_focus.succeeded,
          duration: 3,
          key: 'auto-focus',
          level: MessageLevel.SUCCESS,
        });
      } finally {
        progressCaller.popById('auto-focus');
        setIsProcessing(false);
        toggleAutoFocus(false);
      }
    },
    [isProcessing, lang.operating, message.auto_focus.succeeded, offsetX, width, offsetY, height],
  );

  useEffect(() => {
    const onPin = (pt: IPoint) => {
      executeAutofocus(pt);
    };

    autoFocusEventEmitter.on('pin', onPin);

    return () => {
      autoFocusEventEmitter.removeListener('pin', onPin);
    };
  }, [executeAutofocus]);

  /**
   * Handles clicks on the auto focus button.
   */
  const handleClickButton = async () => {
    if (isProcessing || mode === CanvasMode.AutoFocus) {
      return;
    }

    const cleanup = () => {
      setIsProcessing(false);
      progressCaller.popById('auto-focus');
    };

    setIsProcessing(true);
    progressCaller.openNonstopProgress({ id: 'auto-focus', message: message.connecting });

    try {
      const res = await deviceMaster.select(selectedDevice!);
      const deviceStatus = await checkDeviceStatus(selectedDevice!);

      if (!res.success || !deviceStatus) {
        alertCaller.popUp({
          caption: lang.title,
          message: lang.select_device_error,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return;
      }

      if (!alertConfig.read('skip_auto_focus_warning')) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          alertCaller.popUp({
            buttonLabels: [global.cancel, beambox.popup.still_continue],
            callbacks: [() => resolve(false), () => resolve(true)],
            checkbox: {
              callbacks: () => alertConfig.write('skip_auto_focus_warning', true),
              text: alert.dont_show_again,
            },
            id: 'auto_focus_warning',
            message: message.auto_focus.warning_at_coordinates,
            primaryButtonIndex: 1,
            type: alertConstants.SHOW_POPUP_WARNING,
          });
        });

        if (!shouldContinue) {
          return;
        }
      }

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

      if (!prerequisite) {
        return;
      }

      const setupDevice = async () => {
        progressCaller.update('auto-focus', { message: message.enteringRawMode });

        const control = await deviceMaster.getControl();

        if (control.getMode() !== 'raw') {
          await deviceMaster.enterRawMode();
        }

        progressCaller.update('auto-focus', { message: message.exitingRotaryMode });
        await deviceMaster.rawSetRotary(false);
        progressCaller.update('auto-focus', { message: message.homing });

        if (selectedDevice?.model === 'fhexa1') {
          await deviceMaster.rawUnlock();
        }

        await deviceMaster.rawHome();
      };

      svgCanvas.clearSelection();
      toggleAutoFocus(true);
      await setupDevice();
    } finally {
      cleanup();
    }
  };

  useEffect(() => {
    if (mode !== CanvasMode.AutoFocus) return;

    const unregister = shortcuts.on(
      ['Escape'],
      () => {
        if (!isProcessing) {
          toggleAutoFocus(false);
        }
      },
      { isBlocking: true },
    );

    return unregister;
  }, [isProcessing, mode]);

  return (
    <div
      className={classNames(styles.button, {
        [styles.disabled]: isProcessing || !isDeviceSupportAutoFocus || isPreviewMode,
      })}
      onClick={handleClickButton}
      title={lang.title}
    >
      <TopBarIcons.AutoFocus />
    </div>
  );
};

export default AutoFocusButton;
