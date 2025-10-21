import alertCaller from '@core/app/actions/alert-caller';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import { CanvasMode } from '@core/app/constants/canvasMode';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import tutorialController from '@core/app/views/tutorials/tutorialController';
import showResizeAlert from '@core/helpers/device/fit-device-workarea-alert';
import getDevice from '@core/helpers/device/get-device';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { useCanvasStore } from '../canvasStore';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

let unregisterEndPreviewShortcut: (() => void) | null = null;

const setCursor = (cursor: string) => {
  const workarea = document.getElementById('workarea');

  if (workarea) workarea.style.cursor = cursor;
};

export const endPreviewMode = (): void => {
  try {
    if (previewModeController.isPreviewMode) {
      previewModeController.end();
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_EDIT_MODE) {
      tutorialController.handleNextStep();
    }

    // eslint-disable-next-line hooks/rules-of-hooks
    FnWrapper.useSelectTool();
    $('#workarea').off('contextmenu');

    const workareaEventEmitter = eventEmitterFactory.createEventEmitter('workarea');

    workareaEventEmitter.emit('update-context-menu', { menuDisabled: false });

    // clear end preview shortcut after preview mode ended
    unregisterEndPreviewShortcut?.();
    unregisterEndPreviewShortcut = null;

    useCanvasStore.getState().setMode(CanvasMode.Draw);
  }
};

let isSettingUpPreview = false;

export const setupPreviewMode = async (opts: { callback?: () => void; showModal?: boolean } = {}) => {
  if (isSettingUpPreview) return;

  isSettingUpPreview = true;

  const { callback, showModal } = opts;
  const { device, isWorkareaMatched } = await getDevice(showModal);

  if (!(await previewModeController.checkDevice(device))) {
    isSettingUpPreview = false;

    return;
  }

  if (!isWorkareaMatched && !(await showResizeAlert(device!))) {
    isSettingUpPreview = false;

    return;
  }

  const t = i18n.lang.topbar;

  // eslint-disable-next-line hooks/rules-of-hooks
  FnWrapper.useSelectTool();
  svgCanvas.clearSelection();
  setCursor('wait');

  try {
    await previewModeController.start(device!);

    if (!previewModeController.isPreviewMode) {
      setCursor('auto');
      isSettingUpPreview = false;

      return;
    }

    unregisterEndPreviewShortcut = shortcuts.on(['Escape'], endPreviewMode, { isBlocking: true });

    setCursor('url(img/camera-cursor.svg) 9 12, cell');

    if (previewModeController.isFullScreen) {
      previewModeController.previewFullWorkarea(() => {
        if (tutorialController.getNextStepRequirement() === tutorialConstants.PREVIEW_PLATFORM) {
          tutorialController.handleNextStep();
        }
      });
    }

    useCanvasStore.getState().setMode(CanvasMode.Preview);
    callback?.();
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      if (error.message && error.message.startsWith('Camera WS')) {
        alertCaller.popUpError({
          message: `${t.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
        });
      } else {
        alertCaller.popUpError({
          message: `${t.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
        });
      }
    }

    // eslint-disable-next-line hooks/rules-of-hooks
    FnWrapper.useSelectTool();
  } finally {
    isSettingUpPreview = false;
  }
};

export const changeToPreviewMode = () => {
  const workareaEventEmitter = eventEmitterFactory.createEventEmitter('workarea');

  svgCanvas.setMode('select');
  workareaEventEmitter.emit('update-context-menu', { menuDisabled: true });

  $('#workarea').on('contextmenu', () => {
    endPreviewMode();

    return false;
  });
  useCanvasStore.getState().setMode(CanvasMode.Preview);
  setCursor('url(img/camera-cursor.svg) 9 12, cell');

  if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_PREVIEW_MODE) {
    tutorialController.handleNextStep();
  }
};
