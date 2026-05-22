import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import Constant from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { bb2PerspectiveGrid, bm2PerspectiveGrid } from '@core/app/constants/fisheyeCameraConstants';
import { setCameraPreviewState, useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useDocumentStore } from '@core/app/stores/documentStore';
import alertConfig from '@core/helpers/api/alert-config';
import getUtilWS from '@core/helpers/api/utils-ws';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import i18n from '@core/helpers/i18n';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import { dataCache, setDataCache } from './dataCache';

export const getRegionPreviewSizePx = (): null | { height: number; width: number } => {
  const { workarea } = useDocumentStore.getState();
  const grid = match(workarea)
    .with('fbb2', 'fhx2rf', () => bb2PerspectiveGrid)
    .with('fbm2', () => bm2PerspectiveGrid)
    .otherwise(() => null);

  if (!grid) return null;

  return {
    height: (grid.y[1] - grid.y[0]) * Constant.dpmm,
    width: (grid.x[1] - grid.x[0]) * Constant.dpmm,
  };
};

const regionModes = [PreviewMode.PRECISE_REGION, PreviewMode.REGION] as const;

const getRegionMode = (): null | PreviewMode => {
  const { supportedPreviewModes } = useCameraPreviewStore.getState();

  return regionModes.find((mode) => supportedPreviewModes.includes(mode)) ?? null;
};

const ensurePreviewMode = async (): Promise<boolean> => {
  const regionMode = getRegionMode();

  if (!regionMode) return false;

  if (previewModeController.isPreviewMode) {
    if (previewModeController.previewManager?.previewMode !== regionMode) {
      await previewModeController.switchPreviewMode(regionMode);
    }

    return true;
  }

  setCameraPreviewState({ pendingPreviewMode: regionMode });
  await setupPreviewMode();

  return previewModeController.isPreviewMode;
};

const retakeContourPreview = async (
  contours: AutoFitContour[],
  isBackgroundRemoved = false,
): Promise<null | { data: AutoFitContour[][]; imageUrl: string }> => {
  if (!alertConfig.read('skip_auto_fit_retake_preview_warning')) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write('skip_auto_fit_retake_preview_warning', true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: i18n.lang.alert.dont_show_again,
        },
        message: i18n.lang.auto_fit.warning_retake_preview,
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) return null;
  }

  progressCaller.openNonstopProgress({ id: 'auto-fit-retake', message: i18n.lang.general.processing });

  try {
    if (!(await ensurePreviewMode())) return null;

    if (isBackgroundRemoved && dataCache.removedBgImageUrl) {
      await previewModeBackgroundDrawer.setCanvasUrl(dataCache.removedBgImageUrl, { loadToCanvas: true });
    }

    const sorted = [...contours].sort((a, b) => a.center[0] - b.center[0]);

    for (const contour of sorted) {
      const { bbox, center } = contour;
      const [bboxX, bboxY, bboxW, bboxH] = bbox;

      // Convert contour center from canvas px to camera movement mm
      const position = previewModeController.getPreviewPosition(center[0], center[1], { clipByWorkArea: false });

      if (!position) continue;

      const imgUrl = await previewModeController.getPhotoAfterMoveTo(position.x, position.y);

      if (!imgUrl) continue;

      const preprocessedCanvas = await previewModeController.preprocessImage(imgUrl);

      if (!preprocessedCanvas) {
        URL.revokeObjectURL(imgUrl);
        continue;
      }

      // Expand bbox by 10% in each direction to account for contour erosion
      const padX = bboxW * 0.1;
      const padY = bboxH * 0.1;
      const cropX = bboxX - padX;
      const cropY = bboxY - padY;
      const cropW = bboxW + padX * 2;
      const cropH = bboxH + padY * 2;

      // Crop preprocessed canvas to padded bbox
      // Preprocessed canvas center maps to contour center in workarea px
      const offsetX = cropX - (center[0] - preprocessedCanvas.width / 2);
      const offsetY = cropY - (center[1] - preprocessedCanvas.height / 2);

      const croppedCanvas = document.createElement('canvas');

      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;

      const ctx = croppedCanvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(preprocessedCanvas, offsetX, offsetY, cropW, cropH, 0, 0, cropW, cropH);

        // Draw cropped canvas to background at padded bbox center
        const cropCenterX = cropX + cropW / 2;
        const cropCenterY = cropY + cropH / 2;

        await previewModeBackgroundDrawer.drawImageToCanvas(croppedCanvas, cropCenterX, cropCenterY);
      }

      URL.revokeObjectURL(imgUrl);
    }

    // Re-run contour detection on the updated preview
    const newUrl = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });

    if (!newUrl) return null;

    const resp = await fetch(newUrl);
    const blob = await resp.blob();
    const utilWS = getUtilWS();
    const data = await utilWS.getAllSimilarContours(blob, { isSplicingImg: true });

    setDataCache({ data, url: newUrl });

    if (data.length === 0) return null;

    return { data, imageUrl: newUrl };
  } finally {
    progressCaller.popById('auto-fit-retake');
  }
};

export default retakeContourPreview;
