import alertCaller from '@core/app/actions/alert-caller';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import { getWideAngleCameraData } from '@core/app/actions/camera/preview-helper/getWideAngleCameraData';
import tutorialController from '@core/app/components/tutorials/tutorialController';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import { setCameraPreviewState } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import showResizeAlert from '@core/helpers/device/fit-device-workarea-alert';
import getDevice from '@core/helpers/device/get-device';
import i18n from '@core/helpers/i18n';

export const endPreviewMode = (): void => {
  try {
    if (previewModeController.isPreviewMode || previewModeController.isStarting) {
      previewModeController.end();
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (tutorialController.getNextStepRequirement() === tutorialConstants.END_PREVIEW_MODE) {
      tutorialController.handleNextStep();
    }

    // eslint-disable-next-line hooks/rules-of-hooks
    FnWrapper.useSelectTool();
  }
};

let isSettingUpPreview = false;

export const handlePreviewClick = async ({ showModal = false }: { showModal?: boolean } = {}): Promise<boolean> => {
  if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_PREVIEW_MODE) {
    tutorialController.handleNextStep();
  }

  if (previewModeController.isStarting || previewModeController.isDrawing) return false;

  if (previewModeController.isPreviewMode) {
    if (previewModeController.isFullArea) {
      previewModeController.previewFullWorkarea();

      return false;
    }

    setMouseMode('preview');

    return true;
  }

  const { device, isWorkareaMatched } = await getDevice(showModal);

  if (!device) return false;

  if (!isWorkareaMatched && !(await showResizeAlert(device!))) return false;

  const { canPreview, hasWideAngleCamera } = await getWideAngleCameraData(device);

  setCameraPreviewState({
    isSwitchable: hasWideAngleCamera || device.model === 'fbm2',
  });

  if (device.model === 'ado1' || device.model === 'fbm2' || (hasWideAngleCamera && canPreview)) {
    setupPreviewMode();

    return false;
  }

  setMouseMode('pre_preview');

  return true;
};

export const setupPreviewMode = async ({
  callback,
  showModal,
}: { callback?: () => void; showModal?: boolean } = {}) => {
  if (isSettingUpPreview) return;

  isSettingUpPreview = true;

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

  try {
    await previewModeController.start(device!);

    if (!previewModeController.isPreviewMode) {
      isSettingUpPreview = false;

      return;
    }

    if (previewModeController.isFullArea) {
      previewModeController.previewFullWorkarea().then(() => {
        if (tutorialController.getNextStepRequirement() === tutorialConstants.PREVIEW_PLATFORM) {
          tutorialController.handleNextStep();
        }
      });
    }

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

useCanvasStore.subscribe(
  (state) => state.mouseMode,
  (mouseMode) => {
    if (mouseMode !== 'preview') {
      if (previewModeController.isPreviewMode) {
        previewModeBackgroundDrawer.clearBoundary();
      }
    } else if (previewModeController.isPreviewMode) {
      previewModeBackgroundDrawer.resetBoundary();
    }
  },
);
