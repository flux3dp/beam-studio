import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import workareaManager from '@core/app/svgedit/workarea';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { reportAlignProgress } from './alignProgress';
import type { Point } from './rigidTransform';
import { runSmartMarkSweep } from './smartMarkSweep';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

/**
 * Whether the active preview manager can drive the camera over a point
 * (region previews) — true also for dual-mode machines (fbm2, wide-angle
 * BB2/HEXA II) whose default capture is a one-shot full-area photo
 */
export const supportsRegionPreview = (): boolean =>
  previewModeController.previewManager?.supportedPreviewModes.includes(PreviewMode.REGION) ?? false;

/**
 * Capture a camera image of the whole workarea: select a device, start preview
 * mode and take a full-workarea capture (machines without one-shot full-area
 * preview sweep the bed as a region preview). When the expected mark positions
 * are given, regional machines run the smart mark-seeking sweep instead of a
 * full sweep: it stops as soon as all marks are found and returns their
 * detected centers. After a capture on a machine with region previews
 * (including dual-mode machines whose capture was one-shot), preview mode is
 * kept running: the align step follows immediately and drives the camera to
 * each mark for its refinement retakes, then ends the mode. The captured image
 * stays in the background drawer, where the mark detection reads it from.
 * @param expectedMarks designed mark positions [TL, TR, BL, BR] in canvas px
 * @param onProgress called with an intermediate image url each time a capture
 * is drawn, so a sweeping region preview can be shown while it is running;
 * the url is only valid until the next capture is drawn
 * @returns the captured workarea image url, whether it was a one-shot
 * full-area capture and the smart-sweep mark centers (null when the capture
 * came from a plain sweep or full-area shot), or null when the capture failed
 */
export const captureWorkareaImage = async ({
  expectedMarks,
  onProgress,
}: {
  expectedMarks?: Point[];
  onProgress?: (url: string) => void;
} = {}): Promise<null | { detectedMarks: null | Point[]; isFullArea: boolean; url: string }> => {
  const originalIsPreviewMode = previewModeController.isPreviewMode;
  let keepPreviewMode = false;
  const handleBackgroundUpdated = (url: string) => onProgress?.(url);

  canvasEventEmitter.on('preview-background-updated', handleBackgroundUpdated);

  try {
    previewModeBackgroundDrawer.clear();

    // device selection + preview setup; on full-area machines this already
    // captures the whole bed — waited for, so the isClean() check below cannot
    // race it into starting a second concurrent capture on the same camera
    if (!previewModeController.isPreviewMode) {
      reportAlignProgress('preparing');
      await setupPreviewMode({ waitForFullAreaCapture: true });
    }

    if (!previewModeController.isPreviewMode) return null;

    const isFullArea = previewModeController.isFullArea;
    // camera space is the machine bed (0,0)-(width, modelHeight); a workarea
    // expansion is canvas-only territory the camera cannot cover
    const { modelHeight, width } = workareaManager;
    let detectedMarks: null | Point[] = null;

    // the plain sweep and the full-area shot cannot report their own tile
    // counts (the preview manager drives them), so the phase is announced
    // without a count; the smart sweep reports each tile below. Only a sweep
    // registers the ESC shortcut — a one-shot full-area capture cannot be stopped.
    reportAlignProgress('capture', { stoppable: !isFullArea });

    if (!isFullArea) {
      const canSmartSweep =
        expectedMarks?.length === 4 && previewModeController.getRegionPreviewPoints(0, 0, width, modelHeight) !== null;

      if (canSmartSweep) {
        try {
          const result = await runSmartMarkSweep(expectedMarks!);

          if (result.failed) return null;

          detectedMarks = result.detectedMarks;
        } catch (error) {
          console.warn('Smart mark sweep failed, falling back to a full region preview', error);

          if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) return null;
        }
      } else if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) {
        return null;
      }
    } else if (previewModeBackgroundDrawer.isClean()) {
      // In case setupPreviewMode previewFullWorkarea failed
      if (!(await previewModeController.previewFullWorkarea())) return null;
    }

    const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });

    if (!url) return null;

    // keep preview mode if model support mark refinement retakes (region previews)
    keepPreviewMode = !isFullArea || supportsRegionPreview();

    return { detectedMarks, isFullArea, url };
  } catch (error) {
    console.error('Failed to capture camera preview for print and cut', error);

    return null;
  } finally {
    canvasEventEmitter.removeListener('preview-background-updated', handleBackgroundUpdated);

    if (!keepPreviewMode && !originalIsPreviewMode && previewModeController.isPreviewMode) previewModeController.end();
  }
};
